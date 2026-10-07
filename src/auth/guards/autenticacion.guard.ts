import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { ES_PUBLICO } from '../decoradores/publico.decorator';
import { ContenidoToken, UsuarioToken } from '../usuario-token.interface';

// Guard global: toda ruta pide un token válido, salvo las marcadas con @Publico()
@Injectable()
export class AutenticacionGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(contexto: ExecutionContext): Promise<boolean> {
    // Mira el método y el controller: se puede marcar una ruta suelta o un controller entero
    const esPublico = this.reflector.getAllAndOverride<boolean>(ES_PUBLICO, [
      contexto.getHandler(),
      contexto.getClass(),
    ]);
    if (esPublico) {
      return true;
    }

    const request = contexto
      .switchToHttp()
      .getRequest<Request & { usuario?: UsuarioToken }>();
    const token = this.extraerToken(request);
    if (!token) {
      throw new UnauthorizedException('Debe iniciar sesión');
    }

    try {
      // Verifica la firma y el vencimiento
      const contenido =
        await this.jwtService.verifyAsync<ContenidoToken>(token);
      request.usuario = {
        id: contenido.sub,
        email: contenido.email,
        rol: contenido.rol,
      };
    } catch {
      throw new UnauthorizedException('La sesión no es válida o expiró');
    }
    return true;
  }

  // Header "Authorization: Bearer <token>"
  private extraerToken(request: Request): string | undefined {
    const [tipo, token] = request.headers.authorization?.split(' ') ?? [];
    return tipo === 'Bearer' ? token : undefined;
  }
}
