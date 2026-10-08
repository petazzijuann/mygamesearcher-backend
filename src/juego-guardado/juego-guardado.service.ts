import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Juego } from '../juego/juego.entity';
import { Usuario } from '../usuario/usuario.entity';
import { CambiarEstadoDto } from './dto/cambiar-estado.dto';
import { GuardarJuegoDto } from './dto/guardar-juego.dto';
import { EstadoJuego } from './estado-juego.enum';
import { JuegoGuardado } from './juego-guardado.entity';

// Relaciones que se devuelven siempre junto con cada juego guardado:
// el juego completo, como lo documenta openapi.json (esquema Juego)
export const RELACIONES = {
  juego: {
    clasificacionEdad: true,
    plataformas: true,
    generos: true,
    caracteristicas: true,
  },
};

@Injectable()
export class JuegoGuardadoService {
  constructor(
    @InjectRepository(JuegoGuardado)
    private readonly juegoGuardadoRepository: Repository<JuegoGuardado>,
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
    @InjectRepository(Juego)
    private readonly juegoRepository: Repository<Juego>,
  ) {}

  // usuarioId siempre es el del token: cada usuario ve y modifica solo su biblioteca
  listar(usuarioId: number, estado?: EstadoJuego): Promise<JuegoGuardado[]> {
    // TypeORM 1.0 da error con valores undefined en el where: el estado se agrega solo si viene
    return this.juegoGuardadoRepository.find({
      where: estado ? { usuarioId, estado } : { usuarioId },
      relations: RELACIONES,
      order: { fecha: 'DESC' },
    });
  }

  async guardar(
    dto: GuardarJuegoDto,
    usuarioId: number,
  ): Promise<JuegoGuardado> {
    const { juegoId, estado } = dto;
    // Si el usuario del token ya no existe (se borró), la sesión no sirve
    if (!(await this.usuarioRepository.existsBy({ id: usuarioId }))) {
      throw new UnauthorizedException('La sesión no es válida o expiró');
    }
    // El juego viene en el body: si no existe, el pedido es incorrecto (400)
    if (!(await this.juegoRepository.existsBy({ id: juegoId }))) {
      throw new BadRequestException(`No existe el juego con id ${juegoId}`);
    }
    if (await this.juegoGuardadoRepository.existsBy({ usuarioId, juegoId })) {
      throw new ConflictException(
        'El juego ya está en la biblioteca del usuario',
      );
    }

    await this.juegoGuardadoRepository.save(
      this.juegoGuardadoRepository.create({ usuarioId, juegoId, estado }),
    );
    return this.buscarGuardado(usuarioId, juegoId);
  }

  async cambiarEstado(
    juegoId: number,
    dto: CambiarEstadoDto,
    usuarioId: number,
  ): Promise<JuegoGuardado> {
    const guardado = await this.buscarGuardado(usuarioId, juegoId);
    guardado.estado = dto.estado;
    await this.juegoGuardadoRepository.save(guardado);
    return this.buscarGuardado(usuarioId, juegoId);
  }

  async quitar(juegoId: number, usuarioId: number): Promise<void> {
    const guardado = await this.buscarGuardado(usuarioId, juegoId);
    await this.juegoGuardadoRepository.remove(guardado);
  }

  // Busca por la clave compuesta; si no está (o no existe el usuario o el juego), 404
  private async buscarGuardado(
    usuarioId: number,
    juegoId: number,
  ): Promise<JuegoGuardado> {
    const guardado = await this.juegoGuardadoRepository.findOne({
      where: { usuarioId, juegoId },
      relations: RELACIONES,
    });
    if (!guardado) {
      throw new NotFoundException(
        'El juego no está en la biblioteca del usuario',
      );
    }
    return guardado;
  }
}
