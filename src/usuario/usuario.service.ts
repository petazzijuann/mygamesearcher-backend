import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { compare, hash } from 'bcryptjs';
import { Repository } from 'typeorm';
import { UsuarioToken } from '../auth/usuario-token.interface';
import { verificarAcceso } from '../auth/verificar-acceso';
import { Plataforma } from '../plataforma/plataforma.entity';
import { ActualizarUsuarioDto } from './dto/actualizar-usuario.dto';
import { CambiarContrasenaDto } from './dto/cambiar-contrasena.dto';
import { CrearUsuarioDto } from './dto/crear-usuario.dto';
import { Rol } from './rol.enum';
import { Usuario } from './usuario.entity';

// Rondas de bcrypt: más rondas, más lento probar contraseñas por fuerza bruta.
// Exportada para que el alta del primer administrador use el mismo valor
export const RONDAS_HASH = 10;

@Injectable()
export class UsuarioService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
    @InjectRepository(Plataforma)
    private readonly plataformaRepository: Repository<Plataforma>,
  ) {}

  async registrar(dto: CrearUsuarioDto): Promise<Usuario> {
    const { contrasena, plataformaId, ...datos } = dto;

    if (await this.usuarioRepository.existsBy({ email: datos.email })) {
      throw new ConflictException(
        `Ya existe un usuario con el email '${datos.email}'`,
      );
    }

    const usuario = this.usuarioRepository.create(datos);
    usuario.contrasenaHash = await hash(contrasena, RONDAS_HASH);
    if (plataformaId !== undefined && plataformaId !== null) {
      usuario.plataforma = await this.buscarPlataforma(plataformaId);
    }
    const guardado = await this.usuarioRepository.save(usuario);

    // Se vuelve a buscar para que la respuesta no incluya el hash
    return this.buscarPorId(guardado.id);
  }

  // usuarioActual llega desde el controller: solo el propio usuario o un ADMIN
  async buscarPorId(
    id: number,
    usuarioActual?: UsuarioToken,
  ): Promise<Usuario> {
    if (usuarioActual) {
      verificarAcceso(usuarioActual, id);
    }
    const usuario = await this.usuarioRepository.findOne({
      where: { id },
      relations: { plataforma: true },
    });
    if (!usuario) {
      throw new NotFoundException(`No se encontró el usuario con id ${id}`);
    }
    return usuario;
  }

  listar(): Promise<Usuario[]> {
    return this.usuarioRepository.find({
      relations: { plataforma: true },
      order: { apellido: 'ASC', nombre: 'ASC' },
    });
  }

  async actualizar(
    id: number,
    dto: ActualizarUsuarioDto,
    usuarioActual: UsuarioToken,
  ): Promise<Usuario> {
    const usuario = await this.buscarPorId(id, usuarioActual);
    const { plataformaId, ...datos } = dto;

    // Solo si viene un email (no null: TypeORM 1.0 da error con null en el where).
    // Un null llega a la base, que lo rechaza, y el filtro responde 400
    if (datos.email && datos.email !== usuario.email) {
      if (await this.usuarioRepository.existsBy({ email: datos.email })) {
        throw new ConflictException(
          `Ya existe un usuario con el email '${datos.email}'`,
        );
      }
    }
    this.usuarioRepository.merge(usuario, datos);

    // null: el usuario queda sin plataforma favorita
    if (plataformaId === null) {
      usuario.plataforma = null;
    } else if (plataformaId !== undefined) {
      usuario.plataforma = await this.buscarPlataforma(plataformaId);
    }
    await this.usuarioRepository.save(usuario);
    return this.buscarPorId(id);
  }

  async cambiarContrasena(
    id: number,
    dto: CambiarContrasenaDto,
    usuarioActual: UsuarioToken,
  ): Promise<void> {
    // Solo el propio usuario: exige la contraseña actual, que un ADMIN no conoce
    if (usuarioActual.id !== id) {
      throw new ForbiddenException(
        'No tiene permiso para acceder a este recurso',
      );
    }
    // El hash tiene select: false, así que se pide explícitamente solo para compararlo
    const usuario = await this.usuarioRepository
      .createQueryBuilder('usuario')
      .addSelect('usuario.contrasenaHash')
      .where('usuario.id = :id', { id })
      .getOne();
    if (!usuario) {
      throw new NotFoundException(`No se encontró el usuario con id ${id}`);
    }
    if (!(await compare(dto.contrasenaActual, usuario.contrasenaHash))) {
      throw new BadRequestException('La contraseña actual es incorrecta');
    }
    if (dto.contrasenaNueva === dto.contrasenaActual) {
      throw new BadRequestException(
        'La contraseña nueva debe ser distinta de la actual',
      );
    }
    // update modifica solo esa columna
    await this.usuarioRepository.update(id, {
      contrasenaHash: await hash(dto.contrasenaNueva, RONDAS_HASH),
    });
  }

  async eliminar(id: number, usuarioActual: UsuarioToken): Promise<void> {
    const usuario = await this.buscarPorId(id, usuarioActual);
    if (usuario.rol === Rol.ADMIN) {
      await this.validarNoEsUltimoAdmin();
    }
    // DELETE directo: Postgres borra en cascada colecciones, búsquedas, recomendaciones y biblioteca
    await this.usuarioRepository.delete(id);
  }

  // Solo ADMIN (lo controla @Roles en el controller)
  async cambiarRol(id: number, rol: Rol): Promise<Usuario> {
    const usuario = await this.buscarPorId(id);
    if (usuario.rol === Rol.ADMIN && rol !== Rol.ADMIN) {
      await this.validarNoEsUltimoAdmin();
    }
    await this.usuarioRepository.update(id, { rol });
    return this.buscarPorId(id);
  }

  // Evita que la API se quede sin administradores
  private async validarNoEsUltimoAdmin(): Promise<void> {
    if ((await this.usuarioRepository.countBy({ rol: Rol.ADMIN })) <= 1) {
      throw new ConflictException(
        'No se puede quitar el rol al último administrador',
      );
    }
  }

  private async buscarPlataforma(id: number): Promise<Plataforma> {
    const plataforma = await this.plataformaRepository.findOneBy({ id });
    if (!plataforma) {
      throw new BadRequestException(`No existe la plataforma con id ${id}`);
    }
    return plataforma;
  }
}
