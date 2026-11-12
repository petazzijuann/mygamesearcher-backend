import { ConfigService } from '@nestjs/config';
import { HttpException } from '@nestjs/common';
import { Juego } from '../juego/juego.entity';
import { GroqService } from './groq.service';

const preferencias = {
  plataformas: [{ id: 1, nombre: 'PC' }],
  generos: [{ id: 2, nombre: 'RPG' }],
  caracteristicas: [],
};
const juego = {
  id: 15,
  titulo: 'Alfa',
  plataformas: preferencias.plataformas,
  generos: preferencias.generos,
  caracteristicas: [],
} as unknown as Juego;
const recomendacion = {
  juegoId: 15,
  motivo: 'Combina los géneros que elegiste.',
};
function respuesta(contenido: unknown, finish = 'stop') {
  return new Response(
    JSON.stringify({
      choices: [
        {
          finish_reason: finish,
          message: { content: JSON.stringify(contenido) },
        },
      ],
    }),
  );
}

describe('GroqService', () => {
  let fetchMock: jest.SpyInstance;
  let service: GroqService;
  beforeEach(() => {
    fetchMock = jest.spyOn(globalThis, 'fetch');
    service = new GroqService(
      new ConfigService({ GROQ_API_KEY: 'clave-de-prueba' }),
    );
  });
  afterEach(() => jest.restoreAllMocks());

  it('construye una solicitud estructurada acotada con preferencias y devuelve juegos reales', async () => {
    fetchMock.mockResolvedValue(
      respuesta({ recomendaciones: [recomendacion] }),
    );
    const candidatos = Array.from({ length: 40 }, (_, i) => ({
      ...juego,
      id: i + 1,
    }));
    const resultado = await service.recomendar(candidatos, preferencias);
    expect(resultado[0].juego).toBe(candidatos[14]);
    const llamada = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(llamada[0]).toBe('https://api.groq.com/openai/v1/chat/completions');
    const body = JSON.parse(llamada[1].body as string) as {
      model: string;
      messages: { content: string }[];
      response_format: { json_schema: { strict: boolean } };
    };
    expect(body.model).toBe('openai/gpt-oss-20b');
    expect(body.response_format.json_schema.strict).toBe(true);
    const prompt = JSON.parse(body.messages[1].content) as {
      candidatos: unknown[];
      preferencias: { plataformas: string[] };
    };
    expect(prompt.candidatos).toHaveLength(30);
    expect(prompt.preferencias.plataformas).toEqual(['PC']);
  });

  it.each([
    { recomendaciones: [{ ...recomendacion, juegoId: 999 }] },
    { recomendaciones: [recomendacion, recomendacion] },
    { recomendaciones: [] },
    { recomendaciones: Array(4).fill(recomendacion) },
    { recomendaciones: [{ juegoId: 15 }] },
    { recomendaciones: [{ ...recomendacion, motivo: ' ' }] },
    { recomendaciones: [{ ...recomendacion, motivo: 'a'.repeat(501) }] },
    { recomendaciones: [{ ...recomendacion, juegoId: '15' }] },
    {},
  ])('rechaza contenido inválido: %j', async (contenido) => {
    fetchMock.mockResolvedValue(respuesta(contenido));
    await expect(
      service.recomendar([juego], preferencias),
    ).rejects.toMatchObject({ status: 502 });
  });

  it('rechaza respuestas truncadas y JSON malformado', async () => {
    fetchMock.mockResolvedValueOnce(
      respuesta({ recomendaciones: [recomendacion] }, 'length'),
    );
    await expect(
      service.recomendar([juego], preferencias),
    ).rejects.toMatchObject({ status: 502 });
    fetchMock.mockResolvedValueOnce(new Response('no es JSON'));
    await expect(
      service.recomendar([juego], preferencias),
    ).rejects.toMatchObject({ status: 502 });
  });

  it.each([
    [401, 503],
    [403, 503],
    [429, 429],
    [500, 503],
    [400, 503],
  ])('traduce HTTP %s sin filtrar datos privados', async (status, esperado) => {
    fetchMock.mockResolvedValue(
      new Response('secreto del proveedor', { status }),
    );
    try {
      await service.recomendar([juego], preferencias);
      throw new Error('Debió fallar');
    } catch (error) {
      expect(error).toBeInstanceOf(HttpException);
      expect((error as HttpException).getStatus()).toBe(esperado);
      expect((error as Error).message).not.toContain('secreto');
    }
  });

  it('maneja red y timeout', async () => {
    fetchMock.mockRejectedValue(new TypeError('red'));
    await expect(
      service.recomendar([juego], preferencias),
    ).rejects.toMatchObject({ status: 503 });
    const controller = new AbortController();
    controller.abort();
    jest.spyOn(AbortSignal, 'timeout').mockReturnValue(controller.signal);
    await expect(
      service.recomendar([juego], preferencias),
    ).rejects.toMatchObject({ status: 504 });
  });

  it('no llama a Groq sin candidatos compatibles', async () => {
    await expect(service.recomendar([], preferencias)).rejects.toMatchObject({
      status: 404,
    });
    await expect(
      service.recomendar(
        [{ ...juego, plataformas: [{ id: 9, nombre: 'Otra' }] }],
        preferencias,
      ),
    ).rejects.toMatchObject({ status: 404 });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('no llama a Groq sin clave o con modelo incompatible', async () => {
    for (const config of [
      {},
      { GROQ_API_KEY: 'test', GROQ_MODEL: 'no-compatible' },
    ]) {
      await expect(
        new GroqService(new ConfigService(config)).recomendar(
          [juego],
          preferencias,
        ),
      ).rejects.toMatchObject({ status: 503 });
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
