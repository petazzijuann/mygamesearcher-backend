import { Rol } from '../../usuario/rol.enum';

// Datos del usuario que devuelve el login (sin el hash de la contraseña).
// Son clases (no interfaces) para que el plugin de Swagger documente la respuesta
export class UsuarioLogin {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  rol: Rol;
}

export class RespuestaLoginDto {
  /** Token JWT: mandarlo en el header Authorization: Bearer <token> */
  token: string;
  usuario: UsuarioLogin;
}
