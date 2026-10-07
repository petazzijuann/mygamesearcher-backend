import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { Rol } from '../../usuario/rol.enum';
import { ROLES } from '../decoradores/roles.decorator';
import { UsuarioToken } from '../usuario-token.interface';

// Guard global: en las rutas con @Roles(), solo pasan los roles indicados.
// Corre después del AutenticacionGuard, que deja el usuario en request.usuario
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(contexto: ExecutionContext): boolean {
    const rolesPermitidos = this.reflector.getAllAndOverride<Rol[]>(ROLES, [
      contexto.getHandler(),
      contexto.getClass(),
    ]);
    if (!rolesPermitidos || rolesPermitidos.length === 0) {
      return true;
    }

    const { usuario } = contexto
      .switchToHttp()
      .getRequest<Request & { usuario?: UsuarioToken }>();
    if (!usuario || !rolesPermitidos.includes(usuario.rol)) {
      throw new ForbiddenException(
        'No tiene permiso para realizar esta acción',
      );
    }
    return true;
  }
}
