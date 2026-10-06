import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { hash } from 'bcryptjs';
import { Repository } from 'typeorm';
import { Plataforma } from '../plataforma/plataforma.entity';
import { CrearUsuarioDto } from './dto/crear-usuario.dto';
import { Usuario } from './usuario.entity';

// Rondas de bcrypt: más rondas, más lento probar contraseñas por fuerza bruta
const RONDAS_HASH = 10;

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

  async buscarPorId(id: number): Promise<Usuario> {
    const usuario = await this.usuarioRepository.findOne({
      where: { id },
      relations: { plataforma: true },
    });
    if (!usuario) {
      throw new NotFoundException(`No se encontró el usuario con id ${id}`);
    }
    return usuario;
  }

  private async buscarPlataforma(id: number): Promise<Plataforma> {
    const plataforma = await this.plataformaRepository.findOneBy({ id });
    if (!plataforma) {
      throw new BadRequestException(`No existe la plataforma con id ${id}`);
    }
    return plataforma;
  }
}
