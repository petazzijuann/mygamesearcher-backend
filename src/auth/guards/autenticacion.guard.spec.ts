import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Rol } from '../../usuario/rol.enum';
import { UsuarioToken } from '../usuario-token.interface';
import { AutenticacionGuard } from './autenticacion.guard';

const SECRETO = 'secreto-de-prueba';

type RequestDePrueba = {
  headers: { authorization?: string };
  usuario?: UsuarioToken;
};

// Arma un ExecutionContext mínimo con el request dado
function contextoCon(request: RequestDePrueba): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => () => undefined,
    getClass: () => class {},
  } as unknown as ExecutionContext;
}

describe('AutenticacionGuard', () => {
  const jwtService = new JwtService({ secret: SECRETO });
  const reflector = new Reflector();
  const guard = new AutenticacionGuard(jwtService, reflector);

  afterEach(() => jest.restoreAllMocks());

  it('deja pasar sin token las rutas marcadas con @Publico()', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
    await expect(guard.canActivate(contextoCon({ headers: {} }))).resolves.toBe(
      true,
    );
  });

  it('responde 401 si la ruta no es pública y no viene token', async () => {
    await expect(
      guard.canActivate(contextoCon({ headers: {} })),
    ).rejects.toThrow(new UnauthorizedException('Debe iniciar sesión'));
  });

  it('responde 401 si el token está firmado con otra clave', async () => {
    const tokenFalso = await new JwtService({ secret: 'otra' }).signAsync({
      sub: 1,
      email: 'x@test.com',
      rol: Rol.ADMIN,
    });
    await expect(
      guard.canActivate(
        contextoCon({ headers: { authorization: `Bearer ${tokenFalso}` } }),
      ),
    ).rejects.toThrow('La sesión no es válida o expiró');
  });

  it('responde 401 si el token está vencido', async () => {
    const vencido = await jwtService.signAsync(
      { sub: 1, email: 'x@test.com', rol: Rol.USUARIO },
      { expiresIn: -10 },
    );
    await expect(
      guard.canActivate(
        contextoCon({ headers: { authorization: `Bearer ${vencido}` } }),
      ),
    ).rejects.toThrow('La sesión no es válida o expiró');
  });

  it('con un token válido deja pasar y guarda el usuario en el request', async () => {
    const token = await jwtService.signAsync({
      sub: 7,
      email: 'u7@test.com',
      rol: Rol.USUARIO,
    });
    const request: RequestDePrueba = {
      headers: { authorization: `Bearer ${token}` },
    };
    await expect(guard.canActivate(contextoCon(request))).resolves.toBe(true);
    expect(request.usuario).toEqual({
      id: 7,
      email: 'u7@test.com',
      rol: Rol.USUARIO,
    });
  });
});
