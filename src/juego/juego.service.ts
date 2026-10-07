import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Caracteristica } from '../caracteristica/caracteristica.entity';
import { ClasificacionEdad } from '../clasificacion-edad/clasificacion-edad.entity';
import { buscarPorIds } from '../comun/buscar-por-ids';
import { Genero } from '../genero/genero.entity';
import { Plataforma } from '../plataforma/plataforma.entity';
import { ActualizarJuegoDto } from './dto/actualizar-juego.dto';
import { CrearJuegoDto } from './dto/crear-juego.dto';
import { Juego } from './juego.entity';

// Relaciones que se devuelven siempre junto con el juego
const RELACIONES = {
  clasificacionEdad: true,
  plataformas: true,
  generos: true,
  caracteristicas: true,
};

// En ILIKE, % y _ son comodines y \ es el carácter de escape:
// se escapan para buscar el texto tal cual lo escribió el usuario
const escaparComodines = (texto: string) => texto.replace(/[\\%_]/g, '\\$&');

@Injectable()
export class JuegoService {
  constructor(
    @InjectRepository(Juego)
    private readonly juegoRepository: Repository<Juego>,
    @InjectRepository(ClasificacionEdad)
    private readonly clasificacionEdadRepository: Repository<ClasificacionEdad>,
    @InjectRepository(Plataforma)
    private readonly plataformaRepository: Repository<Plataforma>,
    @InjectRepository(Genero)
    private readonly generoRepository: Repository<Genero>,
    @InjectRepository(Caracteristica)
    private readonly caracteristicaRepository: Repository<Caracteristica>,
  ) {}

  async crear(dto: CrearJuegoDto): Promise<Juego> {
    const {
      clasificacionEdadId,
      plataformaIds,
      generoIds,
      caracteristicaIds,
      ...datos
    } = dto;
    await this.validarTituloDisponible(datos.titulo, datos.anioLanzamiento);

    const juego = this.juegoRepository.create(datos);
    juego.clasificacionEdad =
      await this.buscarClasificacionEdad(clasificacionEdadId);
    juego.plataformas = await buscarPorIds(
      this.plataformaRepository,
      plataformaIds,
      'las plataformas',
    );
    juego.generos = await buscarPorIds(
      this.generoRepository,
      generoIds,
      'los géneros',
    );
    juego.caracteristicas = await buscarPorIds(
      this.caracteristicaRepository,
      caracteristicaIds ?? [],
      'las características',
    );
    return this.juegoRepository.save(juego);
  }

  // Con titulo, busca juegos que lo contengan en cualquier parte, sin distinguir mayúsculas
  listar(titulo?: string): Promise<Juego[]> {
    return this.juegoRepository.find({
      where: titulo ? { titulo: ILike(`%${escaparComodines(titulo)}%`) } : {},
      relations: RELACIONES,
      order: { titulo: 'ASC' },
    });
  }

  async buscarPorId(id: number): Promise<Juego> {
    const juego = await this.juegoRepository.findOne({
      where: { id },
      relations: RELACIONES,
    });
    if (!juego) {
      throw new NotFoundException(`No se encontró el juego con id ${id}`);
    }
    return juego;
  }

  async actualizar(id: number, dto: ActualizarJuegoDto): Promise<Juego> {
    const juego = await this.buscarPorId(id);
    const {
      clasificacionEdadId,
      plataformaIds,
      generoIds,
      caracteristicaIds,
      ...datos
    } = dto;

    // Si cambia el título o el año, se valida la combinación resultante
    if (datos.titulo !== undefined || datos.anioLanzamiento !== undefined) {
      await this.validarTituloDisponible(
        datos.titulo ?? juego.titulo,
        datos.anioLanzamiento ?? juego.anioLanzamiento,
        id,
      );
    }
    this.juegoRepository.merge(juego, datos);

    // Solo se reemplazan las relaciones que vienen en el body.
    // PartialType deja pasar null sin validar, por eso se controla a mano.
    if (clasificacionEdadId === null) {
      throw new BadRequestException('La clasificación de edad es obligatoria');
    }
    if (clasificacionEdadId !== undefined) {
      juego.clasificacionEdad =
        await this.buscarClasificacionEdad(clasificacionEdadId);
    }
    if (plataformaIds === null) {
      throw new BadRequestException('Las plataformas son obligatorias');
    }
    if (plataformaIds !== undefined) {
      juego.plataformas = await buscarPorIds(
        this.plataformaRepository,
        plataformaIds,
        'las plataformas',
      );
    }
    if (generoIds === null) {
      throw new BadRequestException('Los géneros son obligatorios');
    }
    if (generoIds !== undefined) {
      juego.generos = await buscarPorIds(
        this.generoRepository,
        generoIds,
        'los géneros',
      );
    }
    if (caracteristicaIds !== undefined) {
      juego.caracteristicas = await buscarPorIds(
        this.caracteristicaRepository,
        caracteristicaIds ?? [],
        'las características',
      );
    }
    return this.juegoRepository.save(juego);
  }

  async eliminar(id: number): Promise<void> {
    const juego = await this.buscarPorId(id);
    await this.juegoRepository.remove(juego);
  }

  // Compara el título sin distinguir mayúsculas junto con el año; idExcluido evita chocar con el propio juego al actualizar
  private async validarTituloDisponible(
    titulo: string,
    anioLanzamiento: number,
    idExcluido?: number,
  ): Promise<void> {
    const consulta = this.juegoRepository
      .createQueryBuilder('juego')
      .where('LOWER(juego.titulo) = LOWER(:titulo)', { titulo })
      .andWhere('juego.anioLanzamiento = :anioLanzamiento', {
        anioLanzamiento,
      });
    if (idExcluido !== undefined) {
      consulta.andWhere('juego.id != :idExcluido', { idExcluido });
    }
    if (await consulta.getExists()) {
      throw new ConflictException(
        `Ya existe el juego '${titulo}' del año ${anioLanzamiento}`,
      );
    }
  }

  private async buscarClasificacionEdad(
    id: number,
  ): Promise<ClasificacionEdad> {
    const clasificacion = await this.clasificacionEdadRepository.findOneBy({
      id,
    });
    if (!clasificacion) {
      throw new BadRequestException(
        `No existe la clasificación de edad con id ${id}`,
      );
    }
    return clasificacion;
  }
}
