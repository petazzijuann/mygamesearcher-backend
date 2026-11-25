// Los decoradores de class-transformer (@Type) leen metadatos: fuera de Nest hay que cargarlo a mano
import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { Repository } from 'typeorm';
import { Caracteristica } from '../caracteristica/caracteristica.entity';
import { ClasificacionEdad } from '../clasificacion-edad/clasificacion-edad.entity';
import { Genero } from '../genero/genero.entity';
import { Plataforma } from '../plataforma/plataforma.entity';
import { FiltroJuegosDto } from './dto/filtro-juegos.dto';
import { Juego } from './juego.entity';
import { JuegoService } from './juego.service';

// Convierte el query string como lo hace el ValidationPipe global (transform: true)
const filtro = (query: Record<string, string>) =>
  plainToInstance(FiltroJuegosDto, query);

describe('JuegoService (listado paginado)', () => {
  const findAndCount = jest.fn();
  const servicio = new JuegoService(
    { findAndCount } as unknown as Repository<Juego>,
    {} as Repository<ClasificacionEdad>,
    {} as Repository<Plataforma>,
    {} as Repository<Genero>,
    {} as Repository<Caracteristica>,
  );

  beforeEach(() => findAndCount.mockReset().mockResolvedValue([[], 1061]));

  it('sin parámetros devuelve la página 1 con 20 juegos', async () => {
    const respuesta = await servicio.listar(filtro({}));
    expect(findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 0, take: 20 }),
    );
    expect(respuesta).toEqual({
      datos: [],
      total: 1061,
      pagina: 1,
      limite: 20,
      totalPaginas: 54,
    });
  });

  it('respeta la página y el límite que pide el front', async () => {
    const respuesta = await servicio.listar(
      filtro({ pagina: '3', limite: '50' }),
    );
    expect(findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 100, take: 50 }),
    );
    expect(respuesta).toMatchObject({
      pagina: 3,
      limite: 50,
      totalPaginas: 22,
    });
  });

  it('ordena por título y desempata por id para no repetir juegos entre páginas', async () => {
    await servicio.listar(filtro({}));
    expect(findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({ order: { titulo: 'ASC', id: 'ASC' } }),
    );
  });

  it('sin resultados devuelve 0 páginas', async () => {
    findAndCount.mockResolvedValue([[], 0]);
    const respuesta = await servicio.listar(filtro({ titulo: 'zzz' }));
    expect(respuesta).toMatchObject({ total: 0, totalPaginas: 0 });
  });
});

describe('FiltroJuegosDto (validación del paginado)', () => {
  const errores = async (query: Record<string, string>) =>
    (await validate(filtro(query))).flatMap((e) =>
      Object.values(e.constraints ?? {}),
    );

  it('acepta valores válidos y los convierte a número', async () => {
    const dto = filtro({ pagina: '2', limite: '100' });
    expect(await errores({ pagina: '2', limite: '100' })).toEqual([]);
    expect(dto).toMatchObject({ pagina: 2, limite: 100 });
  });

  it('rechaza un límite mayor a 100', async () => {
    expect(await errores({ limite: '1061' })).toContain(
      'El límite no puede superar los 100 juegos por página',
    );
  });

  it('rechaza páginas menores a 1 o que no son enteras', async () => {
    expect(await errores({ pagina: '0' })).toContain(
      'La página debe ser 1 o mayor',
    );
    expect(await errores({ pagina: 'abc' })).toContain(
      'La página debe ser un número entero',
    );
  });
});
