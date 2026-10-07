import { INestApplication } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { hashSync } from 'bcryptjs';
import request from 'supertest';
import { App } from 'supertest/types';
import { AuthController } from '../src/auth/auth.controller';
import { AuthService } from '../src/auth/auth.service';
import { AutenticacionGuard } from '../src/auth/guards/autenticacion.guard';
import { RolesGuard } from '../src/auth/guards/roles.guard';
import { configurarApp } from '../src/comun/configurar-app';
import { GeneroController } from '../src/genero/genero.controller';
import { GeneroService } from '../src/genero/genero.service';
import { Rol } from '../src/usuario/rol.enum';
import { Usuario } from '../src/usuario/usuario.entity';

// Test de integración del login y la protección de rutas.
// Es real todo el recorrido HTTP: rutas, ValidationPipe, guards, AuthService, JWT y filtro de errores.
// Lo único simulado es la base de datos (repositorio de usuarios y GeneroService),
// para poder correrlo en cualquier computadora sin tocar Supabase.

const CONTRASENA = 'clave1234';
const usuarios = [
  {
    id: 1,
    nombre: 'Admin',
    apellido: 'Test',
    email: 'admin@test.com',
    rol: Rol.ADMIN,
    contrasenaHash: hashSync(CONTRASENA, 4),
  },
  {
    id: 2,
    nombre: 'Usuario',
    apellido: 'Test',
    email: 'usuario@test.com',
    rol: Rol.USUARIO,
    contrasenaHash: hashSync(CONTRASENA, 4),
  },
];

// Imita la consulta del AuthService: createQueryBuilder().addSelect().where(..., { email }).getOne()
const usuarioRepositoryFalso = {
  createQueryBuilder: () => {
    let email: string | undefined;
    const consulta = {
      addSelect: () => consulta,
      where: (_condicion: string, parametros: { email: string }) => {
        email = parametros.email;
        return consulta;
      },
      getOne: () =>
        Promise.resolve(usuarios.find((u) => u.email === email) ?? null),
    };
    return consulta;
  },
};

const generoServiceFalso = {
  listar: jest.fn(() => Promise.resolve([{ id: 1, nombre: 'RPG' }])),
  crear: jest.fn((dto: { nombre: string }) =>
    Promise.resolve({ id: 2, ...dto }),
  ),
};

describe('Login y protección de rutas (integración)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({
      imports: [
        JwtModule.register({
          global: true,
          secret: 'secreto-de-prueba',
          signOptions: { expiresIn: '1h' },
        }),
      ],
      controllers: [AuthController, GeneroController],
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(Usuario),
          useValue: usuarioRepositoryFalso,
        },
        { provide: GeneroService, useValue: generoServiceFalso },
        // Mismos guards globales y en el mismo orden que en AuthModule
        { provide: APP_GUARD, useClass: AutenticacionGuard },
        { provide: APP_GUARD, useClass: RolesGuard },
      ],
    }).compile();

    app = modulo.createNestApplication();
    configurarApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  // Hace el login y devuelve el token
  async function iniciarSesion(email: string): Promise<string> {
    const respuesta = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, contrasena: CONTRASENA })
      .expect(200);
    return (respuesta.body as { token: string }).token;
  }

  it('GET /generos es público: responde 200 sin token', async () => {
    await request(app.getHttpServer())
      .get('/generos')
      .expect(200)
      .expect([{ id: 1, nombre: 'RPG' }]);
  });

  it('POST /generos sin token responde 401', async () => {
    const respuesta = await request(app.getHttpServer())
      .post('/generos')
      .send({ nombre: 'Acción' })
      .expect(401);
    expect((respuesta.body as { message: string }).message).toBe(
      'Debe iniciar sesión',
    );
  });

  it('el login con datos incorrectos responde 401 y con body inválido 400', async () => {
    const incorrecto = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@test.com', contrasena: 'otra-clave' })
      .expect(401);
    expect((incorrecto.body as { message: string }).message).toBe(
      'Email o contraseña incorrectos',
    );

    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'no-es-email' })
      .expect(400);
  });

  it('el login correcto devuelve el token y el usuario sin el hash', async () => {
    const respuesta = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: '  ADMIN@test.com ', contrasena: CONTRASENA })
      .expect(200);
    const cuerpo = respuesta.body as {
      token: string;
      usuario: Record<string, unknown>;
    };
    expect(cuerpo.token).toEqual(expect.any(String));
    expect(cuerpo.usuario).toMatchObject({ id: 1, rol: Rol.ADMIN });
    expect(cuerpo.usuario).not.toHaveProperty('contrasenaHash');
  });

  it('un USUARIO no puede crear géneros: responde 403', async () => {
    const token = await iniciarSesion('usuario@test.com');
    const respuesta = await request(app.getHttpServer())
      .post('/generos')
      .set('Authorization', `Bearer ${token}`)
      .send({ nombre: 'Acción' })
      .expect(403);
    expect((respuesta.body as { message: string }).message).toBe(
      'No tiene permiso para realizar esta acción',
    );
  });

  it('un ADMIN crea el género; el body se valida y se limpia antes de llegar al service', async () => {
    const token = await iniciarSesion('admin@test.com');

    await request(app.getHttpServer())
      .post('/generos')
      .set('Authorization', `Bearer ${token}`)
      .send({ nombre: '  Acción  ', campoDeMas: 'x' })
      .expect(201)
      .expect({ id: 2, nombre: 'Acción' });
    // trim aplicado y campo extra descartado por el whitelist
    expect(generoServiceFalso.crear).toHaveBeenCalledWith({ nombre: 'Acción' });

    const invalido = await request(app.getHttpServer())
      .post('/generos')
      .set('Authorization', `Bearer ${token}`)
      .send({})
      .expect(400);
    expect((invalido.body as { message: string[] }).message).toEqual([
      'El nombre es obligatorio',
    ]);
  });
});
