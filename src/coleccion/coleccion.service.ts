import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsuarioToken } from '../auth/usuario-token.interface';
import { verificarAcceso } from '../auth/verificar-acceso';
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

  // La colección se crea siempre a nombre del usuario del token
  async crear(
    dto: CrearColeccionDto,
    usuarioActual: UsuarioToken,
  ): Promise<Coleccion> {
    const { juegoIds, ...datos } = dto;
    const usuario = await this.buscarUsuario(usuarioActual.id);
    await this.validarNombreDisponible(usuario.id, datos.nombre);

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

  // Solo las colecciones del propio usuario (también si es ADMIN)
  listar(usuarioActual: UsuarioToken): Promise<Coleccion[]> {
    return this.coleccionRepository.find({
      where: { usuario: { id: usuarioActual.id } },
      relations: RELACIONES,
      order: { nombre: 'ASC' },
    });
  }

  // Detalle: el dueño o un ADMIN
  consultar(id: number, usuarioActual: UsuarioToken): Promise<Coleccion> {
    return this.buscarConAcceso(id, usuarioActual);
  }

  async actualizar(
    id: number,
    dto: ActualizarColeccionDto,
    usuarioActual: UsuarioToken,
  ): Promise<Coleccion> {
    const coleccion = await this.buscarConAcceso(id, usuarioActual);
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

  async eliminar(id: number, usuarioActual: UsuarioToken): Promise<void> {
    const coleccion = await this.buscarConAcceso(id, usuarioActual);
    await this.coleccionRepository.remove(coleccion);
  }

  // CUU Administrar colección: agregar un juego
  async agregarJuego(
    id: number,
    juegoId: number,
    usuarioActual: UsuarioToken,
  ): Promise<Coleccion> {
    const coleccion = await this.buscarConAcceso(id, usuarioActual);
    // El juego viene en el body: si no existe, el pedido es incorrecto (400)
    if (!(await this.juegoRepository.existsBy({ id: juegoId }))) {
      throw new BadRequestException(`No existe el juego con id ${juegoId}`);
    }
    if (coleccion.juegos.some((juego) => juego.id === juegoId)) {
      throw new ConflictException('El juego ya está en la colección');
    }
    // Inserta solo la fila de coleccion_juego, sin volver a guardar toda la colección
    await this.coleccionRepository
      .createQueryBuilder()
      .relation(Coleccion, 'juegos')
      .of(id)
      .add(juegoId);
    return this.buscarPorId(id);
  }

  // CUU Administrar colección: quitar un juego
  async quitarJuego(
    id: number,
    juegoId: number,
    usuarioActual: UsuarioToken,
  ): Promise<void> {
    const coleccion = await this.buscarConAcceso(id, usuarioActual);
    if (!coleccion.juegos.some((juego) => juego.id === juegoId)) {
      throw new NotFoundException('El juego no está en la colección');
    }
    // Borra solo la fila de coleccion_juego
    await this.coleccionRepository
      .createQueryBuilder()
      .relation(Coleccion, 'juegos')
      .of(id)
      .remove(juegoId);
  }

  // Sin control de acceso: lo usan los otros métodos para devolver la colección actualizada
  private async buscarPorId(id: number): Promise<Coleccion> {
    const coleccion = await this.coleccionRepository.findOne({
      where: { id },
      relations: RELACIONES,
    });
    if (!coleccion) {
      throw new NotFoundException(`No se encontró la colección con id ${id}`);
    }
    return coleccion;
  }

  // 404 si no existe; 403 si es de otro usuario y el que pide no es ADMIN
  private async buscarConAcceso(
    id: number,
    usuarioActual: UsuarioToken,
  ): Promise<Coleccion> {
    const coleccion = await this.buscarPorId(id);
    verificarAcceso(usuarioActual, coleccion.usuario.id);
    return coleccion;
  }

  // Si el usuario del token ya no existe (se borró), la sesión no sirve
  private async buscarUsuario(id: number): Promise<Usuario> {
    const usuario = await this.usuarioRepository.findOneBy({ id });
    if (!usuario) {
      throw new UnauthorizedException('La sesión no es válida o expiró');
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
