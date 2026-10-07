# DGame (MyGameSearcher) - Backend

API REST que recomienda de 1 a 3 videojuegos según los géneros, características y plataformas que elige el usuario. Además permite armar una biblioteca personal (juegos que le interesan o que ya jugó), colecciones de juegos y consultar y calificar el historial de recomendaciones.

Trabajo práctico de Desarrollo de Software (UTN FRRo). El frontend está en otro repositorio: `mygamesearcher-frontend`.

## Tecnologías

- [NestJS](https://nestjs.com) 11 con TypeScript
- PostgreSQL (Supabase para pruebas y entrega, o una base local) con TypeORM
- Validación de datos con class-validator y class-transformer
- Login con JWT (`@nestjs/jwt`) y contraseñas hasheadas con bcrypt (`bcryptjs`)
- Documentación de la API con Swagger (`@nestjs/swagger`)
- Tests con Jest y Supertest

## Requisitos previos

- **Node.js 20 o superior** (probado con Node 22) y npm.
- **Una base de datos PostgreSQL vacía.** Puede ser:
  - **Supabase** (recomendado): crear un proyecto en https://supabase.com, entrar a **Connect → Session pooler → View parameters** y copiar host, puerto, usuario y base. La contraseña es la que se eligió al crear el proyecto (se puede resetear en *Project Settings → Database*). Usar el *Session pooler* y no la conexión directa, porque la directa es solo IPv6.
  - **PostgreSQL local**: crear una base vacía (por ejemplo `createdb dgame`) y poner `DB_SSL=false`.

No hace falta crear las tablas: la API las crea sola al arrancar (ver más abajo).

## Instalación

```bash
git clone <url-del-repositorio>
cd mygamesearcher-backend
npm install
```

Después crear el archivo `.env` copiando `.env.example` y completar los valores. El `.env` nunca se sube al repositorio.

| Variable | Qué es | Ejemplo |
|---|---|---|
| `NODE_ENV` | Entorno. Con `development` la API crea y actualiza las tablas sola | `development` |
| `PORT` | Puerto de la API | `3000` |
| `DB_HOST` | Host de PostgreSQL | `aws-0-sa-east-1.pooler.supabase.com` o `localhost` |
| `DB_PORT` | Puerto de PostgreSQL | `5432` |
| `DB_USER` | Usuario de PostgreSQL (en el pooler de Supabase tiene la forma `postgres.<id-del-proyecto>`) | `postgres.abcdefghijk` |
| `DB_PASS` | Contraseña de la base | |
| `DB_NAME` | Nombre de la base (en Supabase es `postgres`) | `postgres` |
| `DB_SSL` | `true` para Supabase, `false` para una base local sin SSL | `true` |
| `JWT_SECRET` | Clave para firmar los tokens de sesión. Tiene que ser larga y al azar; sin ella la API no arranca | (ver comando abajo) |
| `JWT_EXPIRACION` | Duración del token | `8h` |
| `ADMIN_EMAIL` | Email del primer administrador | `admin@dgame.com` |
| `ADMIN_CONTRASENA` | Contraseña del primer administrador (de 8 a 72 caracteres) | |

Para generar un `JWT_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Cómo correrlo

```bash
npm run start:dev
```

En la consola tiene que aparecer:

```
API escuchando en http://localhost:3000
Documentación en http://localhost:3000/api
```

En el **primer arranque**:

- **Se crean las tablas** en la base, porque con `NODE_ENV=development` TypeORM sincroniza el esquema con las entidades (`synchronize`).
- **Se crea el administrador** con `ADMIN_EMAIL` y `ADMIN_CONTRASENA`, si todavía no hay ningún usuario ADMIN. La consola muestra `Se creó el administrador ...`.

Para comprobar que responde: `GET http://localhost:3000/` devuelve `Hello World!`.

> Con `NODE_ENV=production` la API **no** crea ni modifica tablas (`synchronize` está desactivado y todavía no hay migraciones). Para una base nueva, levantar la API una vez con `NODE_ENV=development`.

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run start:dev` | Levanta la API en modo desarrollo (se reinicia sola al guardar cambios) |
| `npm run start` | Levanta la API sin reinicio automático |
| `npm run build` y `npm run start:prod` | Compila a `dist/` y corre la versión compilada |
| `npm run test` | Tests unitarios (algoritmo de recomendación, control de acceso y guard de autenticación) |
| `npm run test:e2e` | Test de integración del login y la protección de rutas |
| `npm run docs:openapi` | Regenera `docs/openapi.json` (no necesita `.env` ni base de datos) |
| `npm run lint` | Revisa y corrige el estilo del código |

Los tests no necesitan base de datos ni `.env`.

## Documentación de la API

- **http://localhost:3000/api**: documentación interactiva (Swagger) con todas las rutas, los datos que reciben, las respuestas, los errores posibles y quién puede usar cada una. Se pueden probar desde ahí.
- **http://localhost:3000/api-json**: el mismo contenido en formato OpenAPI.
- **[docs/openapi.json](./docs/openapi.json)**: la documentación exportada, para verla sin levantar la API (por ejemplo, pegándola en https://editor.swagger.io o importándola en Postman).

**Cómo usar las rutas protegidas:** hacer `POST /auth/login` con email y contraseña, copiar el `token` de la respuesta y mandarlo en el header `Authorization: Bearer <token>` (en Swagger, con el botón **Authorize**).

**Niveles de acceso:**

| Quién | Qué puede hacer |
|---|---|
| Cualquiera, sin sesión | Registrarse, iniciar sesión, ver juegos y catálogos (géneros, plataformas, características, clasificaciones de edad) |
| Usuario con sesión | Sus colecciones, su biblioteca, generar recomendaciones y consultar o calificar su historial, ver y editar su perfil |
| ADMIN | Además, crear, modificar y eliminar juegos y catálogos, listar usuarios y cambiar roles |

Todas las respuestas de error tienen la forma `{ "statusCode", "message", "error" }`, con el mensaje en español.

## Estructura del proyecto

```
src/
  main.ts                 -> arranque de la API
  app.module.ts           -> configuración (.env, base de datos) y registro de módulos
  comun/                  -> piezas compartidas (validación global, filtro de errores, Swagger, pipes)
  auth/                   -> login, JWT, guards y decoradores de acceso
  genero/ plataforma/ caracteristica/ clasificacion-edad/   -> catálogos (CRUD simples)
  juego/                  -> CRUD de juegos y listado con filtro por título
  usuario/                -> registro y CRUD de usuarios
  coleccion/              -> CRUD de colecciones y CUU Administrar colección
  juego-guardado/         -> CUU Administrar biblioteca personal (/biblioteca)
  busqueda/ recomendacion/ -> CUU Generar recomendación e historial
test/                     -> test de integración
docs/
  bitacora.md             -> registro de cada paso del desarrollo
  openapi.json            -> documentación de la API exportada
```

Cada módulo sigue la misma arquitectura por capas: **entity** (tabla en la base), **dto** (validación de lo que llega), **service** (lógica de negocio) y **controller** (rutas HTTP, sin lógica).

## Bitácora

El detalle de cada paso del desarrollo (qué se hizo, cómo, por qué y cómo probarlo) está en [docs/bitacora.md](./docs/bitacora.md).
