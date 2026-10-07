import { SetMetadata } from '@nestjs/common';
import { Rol } from '../../usuario/rol.enum';

export const ROLES = 'roles';

// Marca una ruta que solo pueden usar los roles indicados, por ejemplo @Roles(Rol.ADMIN)
export const Roles = (...roles: Rol[]) => SetMetadata(ROLES, roles);
