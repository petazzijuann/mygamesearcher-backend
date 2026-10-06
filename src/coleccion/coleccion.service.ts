import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { buscarPorIds } from '../comun/buscar-por-ids';
import { Juego } from '../juego/juego.entity';
import { Usuario } from '../usuario/usuario.entity';
import { Coleccion } from './coleccion.entity';
import { ActualizarColeccionDto } from './dto/actualizar-coleccion.dto';
import { CrearColeccionDto } from './dto/crear-coleccion.dto';

// Relaciones que se devuelven siempre junto con la colección
const RELACIONES = { usuario: true, juegos: true };

@Injectable()
export class ColeccionService {
  constructor(
    @InjectRepository(Coleccion)
    private readonly coleccionRepository: Repository<Coleccion>,
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
    @InjectRepository(Juego)
    private readonly juegoRepository: Repository<Juego>,
  ) {}

  async crear(dto: CrearColeccionDto): Promise<Coleccion> {
    const { usuarioId, juegoIds, ...datos } = dto;
    const usuario = await this.buscarUsuario(usuarioId);
    await this.validarNombreDisponible(usuarioId, datos.nombre);

    const coleccion = this.coleccionRepository.create(datos);
    coleccion.usuario = usuario;
    coleccion.juegos = await buscarPorIds(
      this.juegoRepository,
      juegoIds ?? [],
      'los juegos',
    );
    const guardada = await this.coleccionRepository.save(coleccion);
    return this.buscarPorId(guardada.id);
  }

  listar(usuarioId?: number): Promise<Coleccion[]> {
    return this.coleccionRepository.find({
      where: usuarioId !== undefined ? { usuario: { id: usuarioId } } : {},
      relations: RELACIONES,
      order: { nombre: 'ASC' },
    });
  }

  async buscarPorId(id: number): Promise<Coleccion> {
    const coleccion = await this.coleccionRepository.findOne({
      where: { id },
      relations: RELACIONES,
    });
    if (!coleccion) {
      throw new NotFoundException(`No se encontró la colección con id ${id}`);
    }
    return coleccion;
  }

  async actualizar(
    id: number,
    dto: ActualizarColeccionDto,
  ): Promise<Coleccion> {
    const coleccion = await this.buscarPorId(id);
    const { juegoIds, ...datos } = dto;

    if (datos.nombre !== undefined) {
      await this.validarNombreDisponible(
        coleccion.usuario.id,
        datos.nombre,
        id,
      );
    }
    this.coleccionRepository.merge(coleccion, datos);

    // Si viene la lista, reemplaza a la anterior; null la vacía
    if (juegoIds !== undefined) {
      coleccion.juegos = await buscarPorIds(
        this.juegoRepository,
        juegoIds ?? [],
        'los juegos',
      );
    }
    await this.coleccionRepository.save(coleccion);
    return this.buscarPorId(id);
  }

  async eliminar(id: number): Promise<void> {
    const coleccion = await this.buscarPorId(id);
    await this.coleccionRepository.remove(coleccion);
  }

  private async buscarUsuario(id: number): Promise<Usuario> {
    const usuario = await this.usuarioRepository.findOneBy({ id });
    if (!usuario) {
      throw new BadRequestException(`No existe el usuario con id ${id}`);
    }
    return usuario;
  }

  // Compara sin distinguir mayúsculas, solo entre las colecciones del mismo usuario;
  // idExcluido evita chocar con la propia colección al actualizar
  private async validarNombreDisponible(
    usuarioId: number,
    nombre: string,
    idExcluido?: number,
  ): Promise<void> {
    const consulta = this.coleccionRepository
      .createQueryBuilder('coleccion')
      .where('coleccion.usuario_id = :usuarioId', { usuarioId })
      .andWhere('LOWER(coleccion.nombre) = LOWER(:nombre)', { nombre });
    if (idExcluido !== undefined) {
      consulta.andWhere('coleccion.id != :idExcluido', { idExcluido });
    }
    if (await consulta.getExists()) {
      throw new ConflictException(
        `El usuario ya tiene una colección con el nombre '${nombre}'`,
      );
    }
  }
}
