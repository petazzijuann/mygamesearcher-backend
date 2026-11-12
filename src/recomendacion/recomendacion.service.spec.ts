import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Busqueda } from '../busqueda/busqueda.entity';
import { Recomendacion } from './recomendacion.entity';
import { Juego } from '../juego/juego.entity';
import { Usuario } from '../usuario/usuario.entity';
import { Plataforma } from '../plataforma/plataforma.entity';
import { Genero } from '../genero/genero.entity';
import { Caracteristica } from '../caracteristica/caracteristica.entity';
import { RecomendacionService } from './recomendacion.service';
import { GroqService } from './groq.service';
import { TipoRecomendacion } from './tipo-recomendacion.enum';
import { Rol } from '../usuario/rol.enum';
import { validate } from 'class-validator';
import { GenerarRecomendacionDto } from './dto/generar-recomendacion.dto';

const usuario = { id: 1, email: 'prueba@example.com', rol: Rol.USUARIO };
const plataforma = { id: 1, nombre: 'PC' };
const genero = { id: 2, nombre: 'RPG' };
const juego = {
  id: 15,
  titulo: 'Alfa',
  anioLanzamiento: 2020,
  plataformas: [plataforma],
  generos: [genero],
  caracteristicas: [],
};
const dto = { plataformaIds: [1], generoIds: [2] };

describe('RecomendacionService: modalidades e historial', () => {
  const groq = { recomendar: jest.fn() };
  const busquedas = {
    create: jest.fn((valor: unknown) => valor),
    save: jest.fn(),
    findOne: jest.fn(),
  };
  const query = {
    select: jest.fn().mockReturnThis(),
    distinct: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    getRawMany: jest.fn(),
  };
  let service: RecomendacionService;
  beforeEach(async () => {
    jest.clearAllMocks();
    query.getRawMany.mockResolvedValue([{ id: 15 }]);
    busquedas.save.mockResolvedValue({ id: 10 });
    busquedas.findOne.mockResolvedValue({ id: 10 });
    groq.recomendar.mockResolvedValue([{ juego, motivo: 'Una aventura RPG.' }]);
    const module = await Test.createTestingModule({
      providers: [
        RecomendacionService,
        { provide: GroqService, useValue: groq },
        { provide: getRepositoryToken(Busqueda), useValue: busquedas },
        { provide: getRepositoryToken(Recomendacion), useValue: {} },
        {
          provide: getRepositoryToken(Juego),
          useValue: {
            createQueryBuilder: () => query,
            find: jest.fn().mockResolvedValue([juego]),
          },
        },
        {
          provide: getRepositoryToken(Usuario),
          useValue: { findOneBy: jest.fn().mockResolvedValue(usuario) },
        },
        {
          provide: getRepositoryToken(Plataforma),
          useValue: { findBy: jest.fn().mockResolvedValue([plataforma]) },
        },
        {
          provide: getRepositoryToken(Genero),
          useValue: { findBy: jest.fn().mockResolvedValue([genero]) },
        },
        { provide: getRepositoryToken(Caracteristica), useValue: {} },
      ],
    }).compile();
    service = module.get(RecomendacionService);
  });

  it('sin tipo conserva filtros y algoritmo, sin llamar a Groq', async () => {
    await service.generar(dto, usuario);
    expect(groq.recomendar).not.toHaveBeenCalled();
    expect(query.innerJoin).toHaveBeenCalledWith(
      'juego.generos',
      'genero',
      'genero.id IN (:...generoIds)',
      { generoIds: [2] },
    );
    expect(busquedas.create).toHaveBeenCalledWith(
      expect.objectContaining({
        tipo: 'SISTEMA',
        usuario,
        recomendaciones: [{ juego, motivo: null, orden: 1 }],
      }),
    );
  });

  it('IA mantiene plataforma y exclusión YA_JUGADO, persiste motivo y usuario', async () => {
    await service.generar({ ...dto, tipo: TipoRecomendacion.IA }, usuario);
    expect(query.innerJoin).toHaveBeenCalledTimes(1);
    expect(query.innerJoin).toHaveBeenCalledWith(
      'juego.plataformas',
      'plataforma',
      'plataforma.id IN (:...plataformaIds)',
      { plataformaIds: [1] },
    );
    expect(query.where).toHaveBeenCalledWith(
      expect.stringContaining('NOT EXISTS'),
      { usuarioId: 1, yaJugado: 'YA_JUGADO' },
    );
    expect(busquedas.create).toHaveBeenCalledWith(
      expect.objectContaining({
        tipo: 'IA',
        usuario,
        recomendaciones: [{ juego, motivo: 'Una aventura RPG.', orden: 1 }],
      }),
    );
    expect(busquedas.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 10 } }),
    );
  });

  it('un fallo de Groq no guarda resultados ni ejecuta fallback', async () => {
    groq.recomendar.mockRejectedValue(new Error('Fallo simulado'));
    await expect(
      service.generar({ ...dto, tipo: TipoRecomendacion.IA }, usuario),
    ).rejects.toThrow('Fallo simulado');
    expect(busquedas.save).not.toHaveBeenCalled();
  });

  it('sin candidatos de sistema responde 404 y no guarda', async () => {
    query.getRawMany.mockResolvedValue([]);
    await expect(service.generar(dto, usuario)).rejects.toMatchObject({
      status: 404,
    });
    expect(busquedas.save).not.toHaveBeenCalled();
  });

  it('valida tipo sin romper clientes que lo omiten', async () => {
    expect(
      await validate(Object.assign(new GenerarRecomendacionDto(), dto)),
    ).toHaveLength(0);
    const errores = await validate(
      Object.assign(new GenerarRecomendacionDto(), dto, { tipo: 'OTRO' }),
    );
    expect(errores.map((e) => e.property)).toContain('tipo');
  });
});
