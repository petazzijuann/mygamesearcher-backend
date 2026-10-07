import { Rol } from '../usuario/rol.enum';

// Datos del usuario que viajan dentro del token y quedan en request.usuario
export interface UsuarioToken {
  id: number;
  email: string;
  rol: Rol;
}

// Contenido firmado del JWT (sub es el nombre estándar para el id del usuario)
export interface ContenidoToken {
  sub: number;
  email: string;
  rol: Rol;
}
