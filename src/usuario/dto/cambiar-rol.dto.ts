import { IsDefined, IsEnum } from 'class-validator';
import { Rol } from '../rol.enum';

// Body de PATCH /usuarios/:id/rol (solo ADMIN).
// class-validator ejecuta los decoradores de abajo hacia arriba
export class CambiarRolDto {
  @IsEnum(Rol, { message: 'El rol debe ser USUARIO o ADMIN' })
  @IsDefined({ message: 'El rol es obligatorio' })
  rol: Rol;
}
