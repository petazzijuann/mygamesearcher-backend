import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { UsuarioToken } from '../usuario-token.interface';

// Entrega en el controller el usuario del token (lo deja ahí el AutenticacionGuard)
export const UsuarioActual = createParamDecorator(
  (_dato: unknown, contexto: ExecutionContext): UsuarioToken | undefined => {
    const request = contexto
      .switchToHttp()
      .getRequest<Request & { usuario?: UsuarioToken }>();
    return request.usuario;
  },
);
