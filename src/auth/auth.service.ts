import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { compare } from 'bcryptjs';
import { Repository } from 'typeorm';
import { Rol } from '../usuario/rol.enum';
import { Usuario } from '../usuario/usuario.entity';
import { LoginDto } from './dto/login.dto';
import { ContenidoToken } from './usuario-token.interface';

export interface RespuestaLogin {
  token: string;
  usuario: {
    id: number;
    nombre: string;
    apellido: string;
    email: string;
    rol: Rol;
  };
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto): Promise<RespuestaLogin> {
    // El hash tiene select: false, así que se pide explícitamente solo para compararlo
    const usuario = await this.usuarioRepository
      .createQueryBuilder('usuario')
      .addSelect('usuario.contrasenaHash')
      .where('usuario.email = :email', { email: dto.email })
      .getOne();

    // Mismo mensaje si no existe el email o si la contraseña no coincide,
    // para no revelar qué emails están registrados
    if (!usuario || !(await compare(dto.contrasena, usuario.contrasenaHash))) {
      throw new UnauthorizedException('Email o contraseña incorrectos');
    }

    const contenido: ContenidoToken = {
      sub: usuario.id,
      email: usuario.email,
      rol: usuario.rol,
    };
    return {
      token: await this.jwtService.signAsync(contenido),
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        email: usuario.email,
        rol: usuario.rol,
      },
    };
  }
}
