import { Type } from 'class-transformer';
import { IsDefined, IsInt } from 'class-validator';

// Usuario por query string (?usuarioId=1), para las rutas sin body.
// Temporal: cuando haya login, el usuario sale del token
export class UsuarioQueryDto {
  // El query string llega como texto; @Type lo convierte a número antes de validar
  @Type(() => Number)
  @IsInt({ message: 'El usuario debe ser un id entero' })
  @IsDefined({ message: 'El usuario es obligatorio' })
  usuarioId: number;
}
