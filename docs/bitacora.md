# Bitácora de desarrollo - DGame (MyGameSearcher) Backend

## Paso 1 - Conexión a la BD y configuración base (2026-10-06)

**Qué se hizo:** Se configuró la base de la API: lectura de variables de entorno desde `.env` con `ConfigModule` global, conexión de TypeORM a PostgreSQL en Supabase (con SSL), `ValidationPipe` global con `whitelist` y `transform`, y el puerto de la API tomado de `PORT`.

**Cómo se hizo:**
- Rama `feature/conexion-bd` creada desde `dev` (`git checkout -b feature/conexion-bd`).
- `src/app.module.ts`: se importó `ConfigModule.forRoot({ isGlobal: true })` y `TypeOrmModule.forRootAsync(...)`, que lee `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASS`, `DB_NAME` y `DB_SSL` con `ConfigService`. Opciones: `type: 'postgres'`, `ssl: { rejectUnauthorized: false }` cuando `DB_SSL=true`, `autoLoadEntities: true` y `synchronize` activo salvo que `NODE_ENV=production`.
- `src/main.ts`: `app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))`, puerto leído de `PORT` con `ConfigService` (3000 por defecto) y un log `API escuchando en http://localhost:<PORT>` al arrancar.
- `.env.example`: se agregaron `NODE_ENV` y `DB_SSL`, con valores de ejemplo (`PORT=3000`, `DB_PORT=5432`, `DB_NAME=postgres`, `DB_SSL=true`).
- `.gitignore`: se excluyeron archivos de configuración local de herramientas del editor.

**Por qué:**
- `forRootAsync` con `ConfigService` en vez de leer `process.env` directo: así las variables se leen recién cuando el `.env` ya está cargado, y toda la configuración pasa por el mismo lugar.
- Variables separadas (`DB_HOST`, `DB_USER`, etc.) en vez de una sola URL de conexión: permiten cambiar un dato puntual (por ejemplo, apagar SSL para un Postgres local) sin reescribir toda la URL.
- SSL con `rejectUnauthorized: false`: Supabase exige conexiones cifradas, pero su certificado no está en la cadena de confianza que Node trae por defecto. Con `DB_SSL=false` se puede usar un Postgres local sin SSL.
- Se usa el *Session pooler* de Supabase y no la conexión directa, porque la directa es solo IPv6 y muchas redes domésticas no la soportan.
- `autoLoadEntities: true`: cada módulo registra sus entidades con `TypeOrmModule.forFeature`, sin mantener una lista de rutas a mano.
- `synchronize` atado a `NODE_ENV`: crea y ajusta las tablas solo en desarrollo; en producción no modifica el esquema automáticamente.
- `whitelist` descarta los campos que no están en el DTO (evita que se cuelen datos no esperados). `transform` convierte el body y los parámetros a los tipos declarados (por ejemplo, `"5"` → `5`).
- Alternativas descartadas: validar el `.env` con Joi (requiere una dependencia nueva, se puede sumar más adelante) y un `DataSource` separado para migraciones (innecesario mientras se use `synchronize`).

**Requisito del TP que cubre:** Base técnica de la regularidad: persistencia en base de datos relacional, configuración por variables de entorno y validación de los datos de entrada de la API.

**Cómo probarlo:**
1. Crear el `.env` a partir de `.env.example` con los datos del *Session pooler* de Supabase (Connect → Session pooler → View parameters). El usuario tiene la forma `postgres.<id-del-proyecto>` y la base es `postgres`.
2. Correr `npm run start:dev`. En consola tiene que aparecer, sin errores de conexión:
   ```
   [InstanceLoader] TypeOrmCoreModule dependencies initialized
   [NestApplication] Nest application successfully started
   [Bootstrap] API escuchando en http://localhost:3000
   ```
   Si los datos están mal, aparece `Unable to connect to the database. Retrying (n)...` con el motivo (por ejemplo, `database "x" does not exist`).
3. Request de ejemplo:
   ```
   GET http://localhost:3000/
   ```
   Respuesta esperada: `200 OK` con el texto `Hello World!`.

## Paso 2 - CRUD Género (2026-10-06)

**Qué se hizo:** ABM completo de géneros (alta, listado, consulta por id, modificación y baja) con validación de datos de entrada, nombre único sin distinguir mayúsculas y mensajes de error en español. Es el módulo que sirve de molde para Plataforma, Característica y Clasificación de Edad.

**Cómo se hizo:**
- Rama `feature/crud-genero` creada desde `dev`.
- `npm install @nestjs/mapped-types` (paquete oficial de NestJS que provee `PartialType`).
- Archivos nuevos en `src/genero/`:
  - `genero.entity.ts`: tabla `genero` con `id` autoincremental y `nombre` (`varchar(50)`, único).
  - `dto/crear-genero.dto.ts`: `nombre` obligatorio, texto, hasta 50 caracteres, con `trim` previo.
  - `dto/actualizar-genero.dto.ts`: `PartialType(CrearGeneroDto)`, todos los campos opcionales.
  - `genero.service.ts`: métodos `crear`, `listar`, `buscarPorId`, `actualizar` y `eliminar`, más `validarNombreDisponible` (privado).
  - `genero.controller.ts`: rutas en `/generos`, sin lógica, delega en el service.
  - `genero.module.ts`: registra la entidad con `TypeOrmModule.forFeature([Genero])`.
- `src/app.module.ts`: se importó `GeneroModule`.
- `src/main.ts`: se agregó `stopAtFirstError: true` al `ValidationPipe` global.
- Se reinició la secuencia de ids de `genero` en Supabase después de las pruebas, para que el primer registro real sea el id 1.

**Por qué:**
- `PartialType` en el DTO de actualización: reutiliza las validaciones del DTO de creación marcándolas como opcionales. Si cambia una validación, se aplica a los dos. La alternativa (repetir las validaciones con `@IsOptional()`) obliga a mantenerlas duplicadas en cada CRUD.
- `@Transform` con `trim`: evita guardar nombres con espacios de más y hace que un nombre de solo espacios cuente como vacío.
- Orden de los decoradores: class-validator los ejecuta de abajo hacia arriba, por eso se declaran en orden inverso (largo máximo, texto, obligatorio). Junto con `stopAtFirstError`, cada campo devuelve un solo mensaje, el más relevante (por ejemplo, un body vacío responde solo "El nombre es obligatorio").
- Nombre único validado en el service con `LOWER(nombre) = LOWER(:nombre)`: así no conviven "Acción" y "acción", y se responde 409 con un mensaje claro. Se descartó `ILike` porque interpreta `%` y `_` como comodines. La restricción `unique` de la base queda como segunda barrera.
- Al actualizar, la validación de nombre excluye el propio id: guardar un género con el mismo nombre que ya tenía no es un conflicto.
- `buscarPorId` centraliza el 404 y lo reutilizan `actualizar` y `eliminar`.
- `ParseIntPipe` con mensaje propio (`idPipe`): el mensaje que trae NestJS está en inglés. Queda pendiente moverlo a un archivo común cuando se haga el siguiente CRUD.
- `DELETE` responde `204 No Content` porque no hay nada que devolver.
- Las relaciones N a N con `juego` y `busqueda` se agregan en el Paso 6, desde la entidad que tiene la tabla intermedia.

**Requisito del TP que cubre:** CRUD simple de Género (regularidad), con validación de entrada y manejo de errores mediante códigos HTTP.

**Cómo probarlo:** con la API levantada (`npm run start:dev`):

| Request | Respuesta esperada |
|---|---|
| `POST /generos` `{"nombre": "  Acción  "}` | `201` `{"id":1,"nombre":"Acción"}` |
| `POST /generos` `{"nombre": "RPG", "id": 99}` | `201` `{"id":2,"nombre":"RPG"}` (el `id` enviado se ignora) |
| `POST /generos` `{"nombre": "acción"}` | `409` `"Ya existe un género con el nombre 'acción'"` |
| `POST /generos` `{}` | `400` `["El nombre es obligatorio"]` |
| `POST /generos` `{"nombre": 5}` | `400` `["El nombre debe ser un texto"]` |
| `POST /generos` con un nombre de 51 caracteres | `400` `["El nombre no puede superar los 50 caracteres"]` |
| `GET /generos` | `200` `[{"id":1,"nombre":"Acción"},{"id":2,"nombre":"RPG"}]` |
| `GET /generos/1` | `200` `{"id":1,"nombre":"Acción"}` |
| `GET /generos/9999` | `404` `"No se encontró el género con id 9999"` |
| `GET /generos/abc` | `400` `"El id debe ser un número entero"` |
| `PATCH /generos/2` `{"nombre": "Rol"}` | `200` `{"id":2,"nombre":"Rol"}` |
| `PATCH /generos/2` `{"nombre": "ACCIÓN"}` | `409` `"Ya existe un género con el nombre 'ACCIÓN'"` |
| `PATCH /generos/1` `{"nombre": "Acción"}` | `200` (mismo nombre, no es conflicto) |
| `DELETE /generos/2` | `204` sin contenido |
| `GET /generos/2` | `404` `"No se encontró el género con id 2"` |

## Paso 3 - CRUD Plataforma (2026-10-06)

**Qué se hizo:** ABM completo de plataformas (alta, listado, consulta por id, modificación y baja) siguiendo el molde de Género. Además, el `ParseIntPipe` con mensaje en español se movió a un archivo común para que lo usen todos los controllers.

**Cómo se hizo:**
- Rama `feature/crud-plataforma` creada desde `dev`.
- `src/comun/id.pipe.ts` (nuevo): exporta `idPipe`, el `ParseIntPipe` que responde `400 "El id debe ser un número entero"`.
- `src/genero/genero.controller.ts`: se eliminó la definición local de `idPipe` y se importa desde `src/comun/id.pipe.ts`. El comportamiento de `/generos` no cambia.
- Archivos nuevos en `src/plataforma/`:
  - `plataforma.entity.ts`: tabla `plataforma` con `id` autoincremental y `nombre` (`varchar(50)`, único).
  - `dto/crear-plataforma.dto.ts` y `dto/actualizar-plataforma.dto.ts`: mismas validaciones que Género (`trim`, obligatorio, texto, hasta 50 caracteres) y `PartialType` para la actualización.
  - `plataforma.service.ts`: `crear`, `listar`, `buscarPorId`, `actualizar`, `eliminar` y `validarNombreDisponible` (privado).
  - `plataforma.controller.ts`: rutas en `/plataformas`.
  - `plataforma.module.ts`: registra la entidad con `TypeOrmModule.forFeature([Plataforma])`.
- `src/app.module.ts`: se importó `PlataformaModule`.
- Se reinició la secuencia de ids de `plataforma` en Supabase después de las pruebas.

**Por qué:**
- Las decisiones de validación, unicidad sin distinguir mayúsculas, 404/409 y 204 en el `DELETE` son las mismas del Paso 2.
- `idPipe` en `src/comun/`: con dos controllers usándolo, tenerlo copiado en cada uno obligaría a mantener el mismo código en varios lugares. Ahora cualquier controller nuevo lo importa.
- No se creó una clase base genérica para los CRUDs de catálogo (Género, Plataforma, Característica, Clasificación de Edad): cada service queda explícito y fácil de leer, y los módulos siguientes (Juego, Usuario) no siguen este mismo molde.
- La relación con `juego` se agrega en el Paso 6 y la de `usuario` (`plataforma_id` opcional) en el Paso 7.

**Requisito del TP que cubre:** CRUD simple de Plataforma (regularidad), con validación de entrada y manejo de errores mediante códigos HTTP.

**Cómo probarlo:** con la API levantada (`npm run start:dev`):

| Request | Respuesta esperada |
|---|---|
| `POST /plataformas` `{"nombre": "  PC  "}` | `201` `{"id":1,"nombre":"PC"}` |
| `POST /plataformas` `{"nombre": "PlayStation 5", "id": 99}` | `201` `{"id":2,"nombre":"PlayStation 5"}` (el `id` enviado se ignora) |
| `POST /plataformas` `{"nombre": "pc"}` | `409` `"Ya existe una plataforma con el nombre 'pc'"` |
| `POST /plataformas` `{}` | `400` `["El nombre es obligatorio"]` |
| `POST /plataformas` `{"nombre": 5}` | `400` `["El nombre debe ser un texto"]` |
| `POST /plataformas` con un nombre de 51 caracteres | `400` `["El nombre no puede superar los 50 caracteres"]` |
| `GET /plataformas` | `200` `[{"id":1,"nombre":"PC"},{"id":2,"nombre":"PlayStation 5"}]` |
| `GET /plataformas/1` | `200` `{"id":1,"nombre":"PC"}` |
| `GET /plataformas/9999` | `404` `"No se encontró la plataforma con id 9999"` |
| `GET /plataformas/abc` | `400` `"El id debe ser un número entero"` |
| `PATCH /plataformas/2` `{"nombre": "PS5"}` | `200` `{"id":2,"nombre":"PS5"}` |
| `PATCH /plataformas/2` `{"nombre": "PC"}` | `409` `"Ya existe una plataforma con el nombre 'PC'"` |
| `PATCH /plataformas/1` `{"nombre": "PC"}` | `200` (mismo nombre, no es conflicto) |
| `DELETE /plataformas/2` | `204` sin contenido |
| `GET /plataformas/2` | `404` `"No se encontró la plataforma con id 2"` |
| `GET /generos/abc` | `400` `"El id debe ser un número entero"` (Género sigue funcionando con el `idPipe` común) |

## Paso 4 - CRUD Característica (2026-10-06)

**Qué se hizo:** ABM completo de características de juego (por ejemplo, "Mundo abierto" o "Multijugador en línea"): alta, listado, consulta por id, modificación y baja, siguiendo el mismo molde que Género y Plataforma.

**Cómo se hizo:**
- Rama `feature/crud-caracteristica` creada desde `dev`.
- Archivos nuevos en `src/caracteristica/`:
  - `caracteristica.entity.ts`: tabla `caracteristica` con `id` autoincremental y `nombre` (`varchar(50)`, único).
  - `dto/crear-caracteristica.dto.ts` y `dto/actualizar-caracteristica.dto.ts`: mismas validaciones que los CRUDs anteriores (`trim`, obligatorio, texto, hasta 50 caracteres) y `PartialType` para la actualización.
  - `caracteristica.service.ts`: `crear`, `listar`, `buscarPorId`, `actualizar`, `eliminar` y `validarNombreDisponible` (privado).
  - `caracteristica.controller.ts`: rutas en `/caracteristicas`, usando el `idPipe` común de `src/comun/id.pipe.ts`.
  - `caracteristica.module.ts`: registra la entidad con `TypeOrmModule.forFeature([Caracteristica])`.
- `src/app.module.ts`: se importó `CaracteristicaModule`.
- Se reinició la secuencia de ids de `caracteristica` en Supabase después de las pruebas.

**Por qué:**
- Se reutilizaron sin cambios las decisiones de los Pasos 2 y 3 (validación, unicidad sin distinguir mayúsculas, 404/409, 204 en el `DELETE`, `idPipe` común). No hubo decisiones de diseño nuevas.
- Las relaciones N a N con `juego` y `busqueda` se agregan en los Pasos 6 y 10, desde las entidades que tienen las tablas intermedias.

**Requisito del TP que cubre:** CRUD simple de Característica (regularidad), con validación de entrada y manejo de errores mediante códigos HTTP.

**Cómo probarlo:** con la API levantada (`npm run start:dev`):

| Request | Respuesta esperada |
|---|---|
| `POST /caracteristicas` `{"nombre": "  Mundo abierto  "}` | `201` `{"id":1,"nombre":"Mundo abierto"}` |
| `POST /caracteristicas` `{"nombre": "Multijugador en línea", "id": 99}` | `201` `{"id":2,"nombre":"Multijugador en línea"}` (el `id` enviado se ignora) |
| `POST /caracteristicas` `{"nombre": "MUNDO ABIERTO"}` | `409` `"Ya existe una característica con el nombre 'MUNDO ABIERTO'"` |
| `POST /caracteristicas` `{}` | `400` `["El nombre es obligatorio"]` |
| `POST /caracteristicas` `{"nombre": 5}` | `400` `["El nombre debe ser un texto"]` |
| `POST /caracteristicas` con un nombre de 51 caracteres | `400` `["El nombre no puede superar los 50 caracteres"]` |
| `GET /caracteristicas` | `200` `[{"id":2,"nombre":"Multijugador en línea"},{"id":1,"nombre":"Mundo abierto"}]` (orden alfabético) |
| `GET /caracteristicas/1` | `200` `{"id":1,"nombre":"Mundo abierto"}` |
| `GET /caracteristicas/9999` | `404` `"No se encontró la característica con id 9999"` |
| `GET /caracteristicas/abc` | `400` `"El id debe ser un número entero"` |
| `PATCH /caracteristicas/2` `{"nombre": "Cooperativo"}` | `200` `{"id":2,"nombre":"Cooperativo"}` |
| `PATCH /caracteristicas/2` `{"nombre": "mundo abierto"}` | `409` `"Ya existe una característica con el nombre 'mundo abierto'"` |
| `PATCH /caracteristicas/1` `{"nombre": "Mundo abierto"}` | `200` (mismo nombre, no es conflicto) |
| `DELETE /caracteristicas/2` | `204` sin contenido |
| `GET /caracteristicas/2` | `404` `"No se encontró la característica con id 2"` |
