import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CrearUsuarioDto } from './crear-usuario.dto';

// Sin contraseña (se cambia en PATCH /usuarios/:id/contrasena); todos los campos opcionales.
// El rol tampoco está: si llega en el body, el whitelist lo descarta
export class ActualizarUsuarioDto extends PartialType(
  OmitType(CrearUsuarioDto, ['contrasena'] as const),
) {}
