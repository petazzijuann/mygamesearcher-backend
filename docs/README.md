# MyGameSearcher - Backend

[Documentación](./docs/README.md)

## Instalación
1. Clonar el repo
2. `npm install`
3. Crear `.env` en base a `.env.example`
4. `npm run start:dev`

En el `.env` hay que completar los datos de la base (`DB_*`), `JWT_SECRET` (una clave larga al azar, por ejemplo con `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`), `JWT_EXPIRACION` y los datos del primer administrador (`ADMIN_EMAIL` y `ADMIN_CONTRASENA`), que se crea solo al arrancar la API si no hay ninguno.

## Documentación de la API

Con la API levantada, la documentación interactiva (Swagger) está en:

- **http://localhost:3000/docs**: todas las rutas agrupadas, con sus datos de entrada, respuestas y quién puede usarlas. Se pueden probar desde ahí ("Try it out").
- **http://localhost:3000/docs-json**: el mismo contenido en formato OpenAPI (JSON), para importarlo en Postman u otras herramientas.

Para probar las rutas que piden sesión: hacer `POST /auth/login`, copiar el `token` de la respuesta y pegarlo en el botón **Authorize**.

## Tests

- `npm run test`: tests unitarios (algoritmo de recomendación, control de acceso y guard de autenticación).
- `npm run test:e2e`: test de integración del login y la protección de rutas.

Ninguno necesita base de datos.

## Bitácora

El detalle de cada paso del desarrollo (qué se hizo, cómo, por qué y cómo probarlo) está en [bitacora.md](./bitacora.md).
