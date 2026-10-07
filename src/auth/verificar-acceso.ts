import { ForbiddenException } from '@nestjs/common';
import { Rol } from '../usuario/rol.enum';
import { UsuarioToken } from './usuario-token.interface';

// Deja pasar al dueño del recurso o a un ADMIN; si no, 403
export function verificarAcceso(
  usuarioActual: UsuarioToken,
  propietarioId: number,
): void {
  if (usuarioActual.rol !== Rol.ADMIN && usuarioActual.id !== propietarioId) {
    throw new ForbiddenException(
      'No tiene permiso para acceder a este recurso',
    );
  }
}
