import { ForbiddenException } from '@nestjs/common';
import { Rol } from '../usuario/rol.enum';
import { UsuarioToken } from './usuario-token.interface';
import { verificarAcceso } from './verificar-acceso';

describe('verificarAcceso', () => {
  const usuario: UsuarioToken = {
    id: 1,
    email: 'u1@test.com',
    rol: Rol.USUARIO,
  };
  const admin: UsuarioToken = {
    id: 99,
    email: 'admin@test.com',
    rol: Rol.ADMIN,
  };

  it('deja pasar al dueño del recurso', () => {
    expect(() => verificarAcceso(usuario, 1)).not.toThrow();
  });

  it('deja pasar a un ADMIN aunque el recurso sea de otro usuario', () => {
    expect(() => verificarAcceso(admin, 1)).not.toThrow();
  });

  it('responde 403 si un USUARIO intenta acceder a algo de otro', () => {
    expect(() => verificarAcceso(usuario, 2)).toThrow(ForbiddenException);
    expect(() => verificarAcceso(usuario, 2)).toThrow(
      'No tiene permiso para acceder a este recurso',
    );
  });
});
