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

## Paso 5 - CRUD Clasificación de Edad (2026-10-06)

**Qué se hizo:** ABM completo de clasificaciones de edad (por ejemplo, "ATP", "+13" o "PEGI 18"): alta, listado, consulta por id, modificación y baja, siguiendo el mismo molde que los catálogos anteriores. Con este paso quedan terminados los cuatro catálogos de los que depende Juego.

**Cómo se hizo:**
- Rama `feature/crud-clasificacion-edad` creada desde `dev`.
- Archivos nuevos en `src/clasificacion-edad/`:
  - `clasificacion-edad.entity.ts`: tabla `clasificacion_edad` con `id` autoincremental y `nombre` (`varchar(50)`, único).
  - `dto/crear-clasificacion-edad.dto.ts` y `dto/actualizar-clasificacion-edad.dto.ts`: mismas validaciones que los CRUDs anteriores (`trim`, obligatorio, texto, hasta 50 caracteres) y `PartialType` para la actualización.
  - `clasificacion-edad.service.ts`: `crear`, `listar`, `buscarPorId`, `actualizar`, `eliminar` y `validarNombreDisponible` (privado).
  - `clasificacion-edad.controller.ts`: rutas en `/clasificaciones-edad`, usando el `idPipe` común.
  - `clasificacion-edad.module.ts`: registra la entidad con `TypeOrmModule.forFeature([ClasificacionEdad])`.
- `src/app.module.ts`: se importó `ClasificacionEdadModule`.
- Se reinició la secuencia de ids de `clasificacion_edad` en Supabase después de las pruebas.

**Por qué:**
- Nombres para una entidad de dos palabras, cada uno con la convención de su contexto: tabla `clasificacion_edad` (snake_case, como el resto del modelo), clase `ClasificacionEdad`, carpeta y archivos `clasificacion-edad` (kebab-case, convención de NestJS) y ruta `/clasificaciones-edad` (plural y en minúscula).
- Se reutilizaron sin cambios las decisiones de los pasos anteriores (validación, unicidad sin distinguir mayúsculas, 404/409, 204 en el `DELETE`, `idPipe` común).
- La relación con `juego` (`clasificacion_edad_id`, muchos juegos a una clasificación) se agrega en el Paso 6 desde la entidad Juego, que es la que tiene la clave foránea.

**Requisito del TP que cubre:** CRUD simple de Clasificación de Edad (regularidad), con validación de entrada y manejo de errores mediante códigos HTTP.

**Cómo probarlo:** con la API levantada (`npm run start:dev`):

| Request | Respuesta esperada |
|---|---|
| `POST /clasificaciones-edad` `{"nombre": "  ATP  "}` | `201` `{"id":1,"nombre":"ATP"}` |
| `POST /clasificaciones-edad` `{"nombre": "PEGI 18", "id": 99}` | `201` `{"id":2,"nombre":"PEGI 18"}` (el `id` enviado se ignora) |
| `POST /clasificaciones-edad` `{"nombre": "atp"}` | `409` `"Ya existe una clasificación de edad con el nombre 'atp'"` |
| `POST /clasificaciones-edad` `{}` | `400` `["El nombre es obligatorio"]` |
| `POST /clasificaciones-edad` `{"nombre": 5}` | `400` `["El nombre debe ser un texto"]` |
| `POST /clasificaciones-edad` con un nombre de 51 caracteres | `400` `["El nombre no puede superar los 50 caracteres"]` |
| `GET /clasificaciones-edad` | `200` `[{"id":1,"nombre":"ATP"},{"id":2,"nombre":"PEGI 18"}]` |
| `GET /clasificaciones-edad/1` | `200` `{"id":1,"nombre":"ATP"}` |
| `GET /clasificaciones-edad/9999` | `404` `"No se encontró la clasificación de edad con id 9999"` |
| `GET /clasificaciones-edad/abc` | `400` `"El id debe ser un número entero"` |
| `PATCH /clasificaciones-edad/2` `{"nombre": "+18"}` | `200` `{"id":2,"nombre":"+18"}` |
| `PATCH /clasificaciones-edad/2` `{"nombre": "Atp"}` | `409` `"Ya existe una clasificación de edad con el nombre 'Atp'"` |
| `PATCH /clasificaciones-edad/1` `{"nombre": "ATP"}` | `200` (mismo nombre, no es conflicto) |
| `DELETE /clasificaciones-edad/2` | `204` sin contenido |
| `GET /clasificaciones-edad/2` | `404` `"No se encontró la clasificación de edad con id 2"` |

## Paso 6 - CRUD Juego (2026-10-06)

**Qué se hizo:** ABM completo de juegos con su clasificación de edad (N a 1) y sus plataformas, géneros y características (N a N). Además, se agregó un filtro global que traduce los errores de restricciones de PostgreSQL a respuestas 400/409 en español, y se bloqueó el borrado de cualquier catálogo que esté siendo usado por un juego.

**Cómo se hizo:**
- Rama `feature/crud-juego` creada desde `dev`.
- `src/comun/filtro-errores-bd.filter.ts` (nuevo): atrapa `QueryFailedError` de TypeORM y, según el código de PostgreSQL, responde:
  - `23502` (dato obligatorio nulo) → `400 "Falta un dato obligatorio"`
  - `23503` (clave foránea) al borrar → `409 "No se puede eliminar porque hay otros datos que lo usan"`; al insertar → `400 "Uno de los datos relacionados no existe"`
  - `23505` (valor único repetido) → `409 "Ya existe un registro con esos datos"`
  - Cualquier otro error sigue el manejo normal de NestJS.
- `src/main.ts`: se registró el filtro con `app.useGlobalFilters(new FiltroErroresBd(httpAdapter))`.
- Archivos nuevos en `src/juego/`:
  - `juego.entity.ts`: tabla `juego` (`titulo` varchar(100), `anio_lanzamiento` int, `descripcion` text, `imagen_url` varchar(500) opcional), clave foránea `clasificacion_edad_id` y tablas intermedias `juego_plataforma`, `juego_genero` y `juego_caracteristica`. Restricción única (`titulo`, `anio_lanzamiento`).
  - `dto/crear-juego.dto.ts`: validaciones de cada campo (año entre 1950 y el actual, URL con `http`/`https`, al menos 1 plataforma y 1 género, listas sin ids repetidos, características opcionales).
  - `dto/actualizar-juego.dto.ts`: `PartialType(CrearJuegoDto)`.
  - `juego.service.ts`: `crear`, `listar`, `buscarPorId`, `actualizar`, `eliminar`, y los privados `validarTituloDisponible`, `buscarClasificacionEdad` y `buscarPorIds` (genérico para las tres listas).
  - `juego.controller.ts`: rutas en `/juegos`.
  - `juego.module.ts`: registra `Juego` y las cuatro entidades de catálogo con `TypeOrmModule.forFeature`, para que el service valide los ids del body.
- `src/app.module.ts`: se importó `JuegoModule`.
- `genero.entity.ts`, `plataforma.entity.ts`, `caracteristica.entity.ts`: se agregó la relación inversa `juegos` (`@ManyToMany` con `onDelete: 'RESTRICT'` y `persistence: false`).
- `clasificacion-edad.entity.ts`: se agregó la relación inversa `juegos` (`@OneToMany`).
- Después de las pruebas se borraron los datos y se reiniciaron las secuencias de ids de las cinco tablas.

**Por qué:**
- Las relaciones se mandan en el body como listas de ids (`plataformaIds`, `generoIds`, `caracteristicaIds`) y un `clasificacionEdadId`. En el `PATCH`, una lista enviada reemplaza a la anterior y lo que no se envía no cambia.
- Se exige al menos una plataforma y un género porque la recomendación filtra por esos datos: un juego sin ellos nunca se recomendaría. Las características son opcionales.
- Si un id del body no existe se responde `400` (y no `404`) porque lo incorrecto es el contenido del pedido, no la URL. El mensaje indica qué ids faltan.
- No se repite la combinación título + año (sin distinguir mayúsculas): así se permiten remakes con el mismo nombre ("Doom" 1993 y "Doom" 2016) pero no cargas duplicadas. Se valida en el service con `LOWER(titulo)` y la restricción única de la base queda como segunda barrera.
- `JuegoService` usa directamente los repositorios de los catálogos en lugar de sus services, para no agregar métodos nuevos ni dependencias entre módulos.
- Borrado de catálogos en uso: se eligió bloquearlo con `409` en vez de quitar el dato de los juegos sin avisar. TypeORM crea las tablas intermedias con borrado en cascada salvo que la relación inversa defina otro `onDelete`, por eso se declararon las relaciones inversas con `RESTRICT`.
- `persistence: false` en esas relaciones: durante las pruebas, borrar un género en uso respondía `204` y el juego se quedaba sin género. La causa es que `repository.remove()` borra por su cuenta las filas de la tabla intermedia antes del `DELETE` (lo hace `ManyToManySubjectBuilder.buildForAllRemoval` de TypeORM), y entonces el `RESTRICT` nunca llega a actuar. Con `persistence: false` TypeORM no toca la tabla intermedia desde el lado del catálogo y PostgreSQL bloquea el borrado.
- Filtro global en vez de validar en cada service: los catálogos no conocen a Juego (ni a las entidades que vendrán, como Recomendación o Colección), así que el lugar natural para detectar "está en uso" es la restricción de la base. El filtro lo traduce una sola vez para todos los módulos.
- Código `23502`: `PartialType` marca los campos con `@IsOptional()`, que también deja pasar `null` sin validar. Antes, un `PATCH /generos/1` con `{"nombre": null}` respondía `500`; ahora responde `400`. En Juego, los `null` en `clasificacionEdadId`, `plataformaIds` y `generoIds` se controlan en el service, porque en TypeORM 1.0 un `null` dentro de un `where` produce un error, que llegaría como `500`; así se responde `400` con un mensaje claro. (Corregido en el Paso 9: antes decía que TypeORM ignoraba el `null`.)

**Requisito del TP que cubre:** CRUD dependiente de Juego (regularidad), que depende de los cuatro CRUDs simples anteriores, con relaciones N a 1 y N a N, validación de entrada y manejo de errores mediante códigos HTTP.

**Cómo probarlo:** con la API levantada (`npm run start:dev`), crear primero los datos de catálogo (por ejemplo, plataformas 1 y 2, géneros 1 y 2, característica 1 y clasificación de edad 1). Body base del juego:

```json
{
  "titulo": "Elden Ring",
  "anioLanzamiento": 2022,
  "descripcion": "RPG de acción en mundo abierto",
  "imagenUrl": "https://ejemplo.com/elden.jpg",
  "clasificacionEdadId": 1,
  "plataformaIds": [1, 2],
  "generoIds": [1],
  "caracteristicaIds": [1]
}
```

| Request | Respuesta esperada |
|---|---|
| `POST /juegos` con el body base | `201` con el juego y sus relaciones (`clasificacionEdad`, `plataformas`, `generos`, `caracteristicas`) |
| `POST /juegos` igual pero `"titulo": "ELDEN RING"` | `409` `"Ya existe el juego 'ELDEN RING' del año 2022"` |
| `POST /juegos` igual pero `"anioLanzamiento": 2023` | `201` (otro año se permite) |
| `POST /juegos` `{}` | `400` con un mensaje por campo obligatorio (`"El título es obligatorio"`, `"Los géneros son obligatorios"`, etc.) |
| `POST /juegos` con `"anioLanzamiento": 1900` | `400` `"El año de lanzamiento debe estar entre 1950 y 2026"` |
| `POST /juegos` con `"anioLanzamiento": "2022"` | `400` `"El año de lanzamiento debe ser un número entero"` |
| `POST /juegos` con `"imagenUrl": "no-es-url"` | `400` `"La URL de la imagen no es válida"` |
| `POST /juegos` con `"plataformaIds": []` | `400` `"Debe indicar al menos una plataforma"` |
| `POST /juegos` con `"plataformaIds": [1, 1]` | `400` `"Las plataformas no pueden repetirse"` |
| `POST /juegos` con `"plataformaIds": [1, 9999]` | `400` `"No existen las plataformas con id: 9999"` |
| `POST /juegos` con `"clasificacionEdadId": 9999` | `400` `"No existe la clasificación de edad con id 9999"` |
| `GET /juegos` | `200` con la lista de juegos y sus relaciones, ordenada por título |
| `GET /juegos/9999` | `404` `"No se encontró el juego con id 9999"` |
| `GET /juegos/abc` | `400` `"El id debe ser un número entero"` |
| `PATCH /juegos/2` `{"generoIds": [2]}` | `200`, cambian solo los géneros |
| `PATCH /juegos/2` `{"anioLanzamiento": 2022}` | `409` `"Ya existe el juego 'Elden Ring' del año 2022"` |
| `PATCH /juegos/2` `{"clasificacionEdadId": null}` | `400` `"La clasificación de edad es obligatoria"` |
| `PATCH /juegos/2` `{"titulo": null}` | `400` `"Falta un dato obligatorio"` |
| `PATCH /generos/1` `{"nombre": null}` | `400` `"Falta un dato obligatorio"` |
| `DELETE /generos/1` (lo usa un juego) | `409` `"No se puede eliminar porque hay otros datos que lo usan"` |
| `DELETE /plataformas/1`, `/caracteristicas/1`, `/clasificaciones-edad/1` (en uso) | `409` con el mismo mensaje |
| `DELETE /juegos/1` | `204` sin contenido |
| `DELETE /generos/1` (después de borrar el juego que lo usaba) | `204` sin contenido |

## Paso 7 - Entidad Usuario y CRUD Colección (2026-10-06)

**Qué se hizo:** Se creó la entidad Usuario con registro (`POST /usuarios`) y consulta por id (`GET /usuarios/:id`), guardando la contraseña hasheada con bcrypt. Se hizo el CRUD completo de Colección (`/colecciones`), con sus juegos (N a N). El resto del CRUD de Usuario y el login quedan para la aprobación.

**Cómo se hizo:**
- Rama `feature/usuario-coleccion` creada desde `dev`.
- `npm install bcryptjs` (versión 3.0.3, trae sus propios tipos).
- Archivos nuevos en `src/usuario/`:
  - `rol.enum.ts`: enum `Rol` (`USUARIO`, `ADMIN`), en archivo aparte porque lo van a usar los guards del login.
  - `usuario.entity.ts`: tabla `usuario` con `nombre`, `apellido`, `email` (único), `contrasena_hash` (`select: false`), `rol` (enum de Postgres, por defecto `USUARIO`), `fecha_registro` (`timestamptz`, automática) y `plataforma_id` (opcional, `ON DELETE SET NULL`).
  - `dto/crear-usuario.dto.ts`: nombre y apellido (hasta 50), email (formato válido, se guarda en minúsculas), contraseña (entre 8 y 72 caracteres) y `plataformaId` opcional.
  - `usuario.service.ts`: `registrar` y `buscarPorId`.
  - `usuario.controller.ts`, `usuario.module.ts`.
- Archivos nuevos en `src/coleccion/`:
  - `coleccion.entity.ts`: tabla `coleccion` con `nombre` (hasta 100), `descripcion` (opcional, hasta 500), `fecha_creacion` (`timestamptz`, automática), `usuario_id` (`ON DELETE CASCADE`) y tabla intermedia `coleccion_juego`. Restricción única (`usuario_id`, `nombre`).
  - `dto/crear-coleccion.dto.ts`: `usuarioId`, `nombre`, `descripcion` y `juegoIds` (opcional, sin repetidos).
  - `dto/actualizar-coleccion.dto.ts`: `PartialType(OmitType(CrearColeccionDto, ['usuarioId']))`.
  - `dto/filtro-colecciones.dto.ts`: valida el query `?usuarioId=` del listado.
  - `coleccion.service.ts`: `crear`, `listar`, `buscarPorId`, `actualizar`, `eliminar` y los privados `buscarUsuario` y `validarNombreDisponible`.
  - `coleccion.controller.ts`, `coleccion.module.ts`.
- `src/comun/buscar-por-ids.ts` (nuevo): la función que busca varias entidades por id y responde 400 indicando cuáles faltan. Antes era un método privado de `JuegoService`; ahora la usan Juego y Colección.
- `src/juego/juego.service.ts`: usa `buscarPorIds` desde `src/comun/`.
- `src/app.module.ts`: se importaron `UsuarioModule` y `ColeccionModule`.
- Después de las pruebas se borraron los datos y se reiniciaron las secuencias de ids.

**Por qué:**
- `bcryptjs` en vez de `bcrypt`: es el mismo algoritmo, pero escrito en JavaScript, así que se instala sin compilar código nativo y no falla en ninguna computadora del grupo. Se descartó `crypto.scrypt` de Node porque obliga a manejar la sal a mano y es menos conocido. Se usan 10 rondas, el valor estándar.
- La contraseña nunca sale en una respuesta, por dos vías: la columna tiene `select: false` (TypeORM no la trae salvo que se pida) y, después de guardar, el service vuelve a buscar el usuario en lugar de devolver el objeto en memoria, que sí tiene el hash.
- La contraseña no se recorta (los espacios pueden ser parte de ella) y tiene un máximo de 72 caracteres porque bcrypt ignora lo que pase de 72 bytes.
- El DTO de registro no tiene campo `rol`: si alguien manda `"rol": "ADMIN"`, el `whitelist` lo descarta y el usuario se crea como `USUARIO`. La forma de crear administradores se define con el login.
- El email se guarda en minúsculas para que `Juan@Mail.com` y `juan@mail.com` cuenten como el mismo.
- `fecha_registro` y `fecha_creacion` usan `timestamptz` para que la hora no dependa de la zona horaria del servidor.
- `usuarioId` en el body de la colección es temporal: cuando haya login, el usuario sale del token y se elimina ese campo sin cambiar las rutas. En el `PATCH` no se acepta, para que una colección no cambie de dueño.
- El nombre de la colección es único por usuario, sin distinguir mayúsculas: dos usuarios pueden tener una colección "Favoritos" cada uno.
- Reglas de borrado: si se borra un usuario, se borran sus colecciones; si se borra un juego, sale de las colecciones (no se bloquea, porque el administrador no debería depender de las colecciones de los usuarios); si se borra la plataforma favorita, el usuario queda sin plataforma. No se declararon relaciones inversas en `Usuario`, `Juego` ni `Plataforma`, porque no hacen falta y así `remove()` no limpia por su cuenta las tablas intermedias (el problema encontrado en el Paso 6): los borrados los resuelve PostgreSQL.
- `buscarPorIds` pasó a `src/comun/` porque ya lo usan dos módulos y lo va a usar Búsqueda en el Paso 10.

**Requisito del TP que cubre:** Entidad Usuario y CRUD de Colección dependiente de Usuario (regularidad), con validación de entrada, contraseñas hasheadas y manejo de errores mediante códigos HTTP.

**Cómo probarlo:** con la API levantada (`npm run start:dev`), y con al menos una plataforma y dos juegos cargados (ids 1 y 2):

| Request | Respuesta esperada |
|---|---|
| `POST /usuarios` `{"nombre": "Juan", "apellido": "Pérez", "email": "  Juan@Mail.COM ", "contrasena": "secreta123", "plataformaId": 1, "rol": "ADMIN"}` | `201` con `"email": "juan@mail.com"`, `"rol": "USUARIO"` y la plataforma; sin `contrasena` ni `contrasenaHash` |
| En la base: `SELECT contrasena_hash FROM usuario` | un hash que empieza con `$2b$10$` |
| `POST /usuarios` con `"email": "JUAN@mail.com"` | `409` `"Ya existe un usuario con el email 'juan@mail.com'"` |
| `POST /usuarios` `{}` | `400` `["El nombre es obligatorio", "El apellido es obligatorio", "El email es obligatorio", "La contraseña es obligatoria"]` |
| `POST /usuarios` con `"email": "no-es-email"` | `400` `["El email no es válido"]` |
| `POST /usuarios` con `"contrasena": "12345"` | `400` `["La contraseña debe tener al menos 8 caracteres"]` |
| `POST /usuarios` con `"plataformaId": 9999` | `400` `"No existe la plataforma con id 9999"` |
| `GET /usuarios/1` | `200` con el usuario y su plataforma, sin el hash |
| `GET /usuarios/9999` | `404` `"No se encontró el usuario con id 9999"` |
| `POST /colecciones` `{"usuarioId": 1, "nombre": "  Favoritos ", "descripcion": "Los mejores", "juegoIds": [1, 2]}` | `201` con `"nombre": "Favoritos"`, el usuario (sin hash) y los 2 juegos |
| `POST /colecciones` `{"usuarioId": 1, "nombre": "FAVORITOS"}` | `409` `"El usuario ya tiene una colección con el nombre 'FAVORITOS'"` |
| `POST /colecciones` `{"usuarioId": 2, "nombre": "Favoritos"}` (otro usuario) | `201` |
| `POST /colecciones` `{"usuarioId": 9999, "nombre": "X"}` | `400` `"No existe el usuario con id 9999"` |
| `POST /colecciones` `{"usuarioId": 1, "nombre": "X", "juegoIds": [9999]}` | `400` `"No existen los juegos con id: 9999"` |
| `POST /colecciones` `{}` | `400` `["El usuario es obligatorio", "El nombre es obligatorio"]` |
| `GET /colecciones?usuarioId=1` | `200` solo con las colecciones del usuario 1 |
| `GET /colecciones?usuarioId=abc` | `400` `["El usuario debe ser un id entero"]` |
| `GET /colecciones/9999` | `404` `"No se encontró la colección con id 9999"` |
| `PATCH /colecciones/1` `{"juegoIds": [1]}` | `200`, la colección queda solo con el juego 1 |
| `PATCH /colecciones/1` `{"usuarioId": 2, "nombre": "Mis favoritos"}` | `200`, cambia el nombre y el dueño sigue siendo el usuario 1 |
| `DELETE /juegos/1` y después `GET /colecciones/1` | `204`, y la colección queda sin ese juego |
| `DELETE /plataformas/1` (favorita del usuario 1, sin juegos que la usen) y después `GET /usuarios/1` | `204`, y el usuario queda con `"plataforma": null` |
| `DELETE /colecciones/1` | `204` sin contenido |

## Paso 8 - Listado de juegos filtrado por título y detalle (2026-10-06)

**Qué se hizo:** Se agregó al listado de juegos un filtro opcional por título (`GET /juegos?titulo=...`), que busca coincidencias parciales sin distinguir mayúsculas. El detalle (`GET /juegos/:id`, con clasificación, plataformas, géneros y características) ya existía desde el Paso 6.

**Cómo se hizo:**
- Rama `feature/listado-juegos` creada desde `dev`.
- `src/juego/dto/filtro-juegos.dto.ts` (nuevo): valida el query `titulo` (opcional, texto, sin espacios en los extremos, hasta 100 caracteres).
- `src/juego/juego.service.ts`: `listar(titulo?)` filtra con `ILike('%texto%')` cuando el título no está vacío. Se agregó la función `escaparComodines`.
- `src/juego/juego.controller.ts`: `GET /juegos` recibe el filtro con `@Query()` y se lo pasa al service.

**Por qué:**
- `ILIKE '%texto%'` de PostgreSQL: busca el texto en cualquier parte del título y sin distinguir mayúsculas, que es lo que espera un usuario que escribe parte del nombre ("elden", "SOULS", "den ri").
- Se escapan `%`, `_` y `\`: en `ILIKE` son comodines y carácter de escape. Sin escaparlos, buscar "%" devolvería todos los juegos y "_" cualquier título con al menos un carácter.
- Un título vacío o con solo espacios equivale a no filtrar: el `trim` del DTO lo deja vacío y el service no agrega condición.
- Si no hay coincidencias se responde `200` con `[]` y no `404`: una búsqueda sin resultados no es un error, y así el frontend no tiene que tratarla como uno.
- Si el query se repite (`?titulo=a&titulo=b`), Express arma una lista y el DTO la rechaza con `400`.
- Pendiente como posible mejora: la búsqueda distingue tildes ("accion" no encuentra "Acción"). Para ignorarlas habría que activar la extensión `unaccent` de PostgreSQL en Supabase.

**Requisito del TP que cubre:** Listado de juegos filtrado por nombre y detalle del juego (regularidad).

**Cómo probarlo:** con la API levantada (`npm run start:dev`) y los juegos "Elden Ring", "Dark Souls", "100% Orange Juice" y "Super_Hot" cargados:

| Request | Respuesta esperada |
|---|---|
| `GET /juegos` | `200` con los 4 juegos ordenados por título |
| `GET /juegos?titulo=elden` | `200` con solo "Elden Ring" |
| `GET /juegos?titulo=SOULS` | `200` con solo "Dark Souls" |
| `GET /juegos?titulo=den ri` | `200` con solo "Elden Ring" |
| `GET /juegos?titulo=zelda` | `200` `[]` |
| `GET /juegos?titulo=%25` (el carácter `%`) | `200` con solo "100% Orange Juice" |
| `GET /juegos?titulo=_` | `200` con solo "Super_Hot" |
| `GET /juegos?titulo=` | `200` con los 4 juegos |
| `GET /juegos?titulo=a&titulo=b` | `400` `["El título a buscar debe ser un texto"]` |
| `GET /juegos?titulo=` con 101 caracteres | `400` `["El título a buscar no puede superar los 100 caracteres"]` |
| `GET /juegos/1` | `200` con el juego, su clasificación de edad, plataformas, géneros y características |

## Paso 9 - CUU Administrar biblioteca personal (2026-10-06)

**Qué se hizo:** Caso de uso de la biblioteca personal: el usuario guarda juegos marcándolos como `ME_INTERESA` o `YA_JUGADO`, les cambia el estado, los quita y consulta su biblioteca (completa o filtrada por estado). Es la base para que la recomendación del Paso 10 no sugiera juegos ya jugados.

**Cómo se hizo:**
- Rama `feature/biblioteca` creada desde `dev`.
- Archivos nuevos en `src/juego-guardado/` (el módulo lleva el nombre de la clase de negocio; la ruta, el del caso de uso):
  - `estado-juego.enum.ts`: enum `EstadoJuego` (`ME_INTERESA`, `YA_JUGADO`).
  - `juego-guardado.entity.ts`: tabla `juego_guardado` con clave primaria compuesta (`usuario_id`, `juego_id`), ambas también claves foráneas con `ON DELETE CASCADE`, `estado` (enum de Postgres) y `fecha` (`timestamptz`, `@UpdateDateColumn`).
  - `dto/guardar-juego.dto.ts`: `usuarioId`, `juegoId` y `estado`, obligatorios.
  - `dto/cambiar-estado.dto.ts`: `PickType(GuardarJuegoDto, ['usuarioId', 'estado'])`.
  - `dto/usuario-query.dto.ts`: `usuarioId` obligatorio por query string, convertido a número con `@Type(() => Number)`.
  - `dto/filtro-biblioteca.dto.ts`: extiende el anterior y agrega `estado` opcional.
  - `juego-guardado.service.ts`: `listar`, `guardar`, `cambiarEstado`, `quitar` y el privado `buscarGuardado`.
  - `juego-guardado.controller.ts`: rutas en `/biblioteca`.
  - `juego-guardado.module.ts`: registra `JuegoGuardado`, `Usuario` y `Juego` con `TypeOrmModule.forFeature`.
- `src/app.module.ts`: se importó `JuegoGuardadoModule`.
- `docs/bitacora.md`: se corrigió una explicación del Paso 6 sobre el manejo de `null` en TypeORM (ver abajo).
- Después de las pruebas se borraron los datos y se reiniciaron las secuencias de ids.

**Por qué:**
- Clave primaria compuesta (`usuario_id`, `juego_id`): la base garantiza que un juego aparezca una sola vez en la biblioteca de cada usuario. Se mapean las columnas dos veces (`usuarioId` como número y `usuario` como relación) para poder buscar por la clave sin cargar el usuario.
- `POST` para guardar y `PATCH` para cambiar el estado, separados: sigue el mismo esquema que los CRUDs. El `POST` responde `409` si el juego ya estaba y el `PATCH` `404` si no estaba. Se descartó un único `PUT` que guardara o actualizara.
- `fecha` es la del último cambio de estado (`@UpdateDateColumn`): indica desde cuándo el juego está en ese estado, por ejemplo cuándo se marcó como jugado. Si se manda el mismo estado que ya tenía, TypeORM no ejecuta el `UPDATE` y la fecha no cambia. El listado se ordena de la fecha más reciente a la más vieja.
- Códigos de error: si el usuario o el juego no existen y vienen en el body (`POST`), es `400`. Si el usuario del listado no existe, `404`. En `PATCH` y `DELETE` se busca directamente la fila: si no está (por el motivo que sea), `404` "El juego no está en la biblioteca del usuario".
- `usuarioId` por query string en `GET` y `DELETE` (esas requests no llevan body) y en el body en `POST` y `PATCH`. Igual que en Colección, es temporal hasta el login.
- Si se borra un usuario o un juego, sus filas de la biblioteca se borran en cascada. No se declararon relaciones inversas en `Usuario` ni en `Juego`, para que el borrado lo resuelva PostgreSQL (ver Paso 6).
- TypeORM 1.0 produce un error si una condición del `where` vale `undefined` o `null` (en versiones anteriores la ignoraba). Por eso el filtro por estado se agrega al `where` solo cuando viene en el pedido. Al revisarlo se encontró que la explicación del Paso 6 sobre este tema era incorrecta y se corrigió.

**Requisito del TP que cubre:** CUU Administrar biblioteca personal (regularidad).

**Cómo probarlo:** con la API levantada (`npm run start:dev`), dos usuarios (1 y 2) y tres juegos (1, 2 y 3) cargados:

| Request | Respuesta esperada |
|---|---|
| `POST /biblioteca` `{"usuarioId": 1, "juegoId": 1, "estado": "ME_INTERESA"}` | `201` con `usuarioId`, `juegoId`, `estado`, `fecha` y el juego con su clasificación de edad |
| `POST /biblioteca` `{"usuarioId": 1, "juegoId": 2, "estado": "YA_JUGADO"}` | `201` |
| `POST /biblioteca` `{"usuarioId": 1, "juegoId": 1, "estado": "YA_JUGADO"}` | `409` `"El juego ya está en la biblioteca del usuario"` |
| `POST /biblioteca` `{"usuarioId": 2, "juegoId": 1, "estado": "ME_INTERESA"}` | `201` (cada usuario tiene su biblioteca) |
| `POST /biblioteca` con `"usuarioId": 9999` | `400` `"No existe el usuario con id 9999"` |
| `POST /biblioteca` con `"juegoId": 9999` | `400` `"No existe el juego con id 9999"` |
| `POST /biblioteca` con `"estado": "TERMINADO"` | `400` `["El estado debe ser ME_INTERESA o YA_JUGADO"]` |
| `POST /biblioteca` `{}` | `400` `["El usuario es obligatorio", "El juego es obligatorio", "El estado es obligatorio"]` |
| `GET /biblioteca?usuarioId=1` | `200` con los juegos 2 y 1, del más reciente al más viejo |
| `GET /biblioteca?usuarioId=1&estado=YA_JUGADO` | `200` con solo el juego 2 |
| `GET /biblioteca` | `400` `["El usuario es obligatorio"]` |
| `GET /biblioteca?usuarioId=abc` | `400` `["El usuario debe ser un id entero"]` |
| `GET /biblioteca?usuarioId=9999` | `404` `"No se encontró el usuario con id 9999"` |
| `GET /biblioteca?usuarioId=2` | `200` con solo su juego (no ve los del usuario 1) |
| `PATCH /biblioteca/1` `{"usuarioId": 1, "estado": "YA_JUGADO"}` | `200`, cambian el estado y la fecha |
| Repetir el mismo `PATCH` | `200`, la fecha no cambia |
| `PATCH /biblioteca/3` `{"usuarioId": 1, "estado": "YA_JUGADO"}` (no está guardado) | `404` `"El juego no está en la biblioteca del usuario"` |
| `DELETE /biblioteca/2?usuarioId=1` | `204` sin contenido |
| Repetir el mismo `DELETE` | `404` `"El juego no está en la biblioteca del usuario"` |
| `DELETE /biblioteca/1` (sin `usuarioId`) | `400` `["El usuario es obligatorio"]` |
| `DELETE /juegos/1` y después `GET /biblioteca?usuarioId=1` | `204`, y el juego ya no aparece en ninguna biblioteca |

## Paso 10 - CUU Generar recomendación personalizada (2026-10-06)

**Qué se hizo:** Caso de uso central de la aplicación. El usuario elige plataformas, géneros y características; la API selecciona de 1 a 3 juegos según esos criterios (sin recomendar los que marcó como `YA_JUGADO`) y guarda la búsqueda con sus recomendaciones, que quedan disponibles para el historial.

**Cómo se hizo:**
- Rama `feature/recomendacion` creada desde `dev`.
- `src/busqueda/busqueda.entity.ts` (nuevo): tabla `busqueda` con `usuario_id` (`ON DELETE CASCADE`), `fecha_busqueda` (`timestamptz`, automática), tablas intermedias `busqueda_plataforma`, `busqueda_genero` y `busqueda_caracteristica`, y la relación `recomendaciones` con `cascade: ['insert']`.
- Archivos nuevos en `src/recomendacion/`:
  - `recomendacion.entity.ts`: tabla `recomendacion` con `busqueda_id` y `juego_id` (ambas `ON DELETE CASCADE`), `orden`, y `calificacion`, `comentario` y `fecha_calificacion` opcionales (se completan cuando el usuario califique). Restricciones: única (`busqueda_id`, `juego_id`), `CHECK` de `orden` entre 1 y 3 y de `calificacion` entre 1 y 5.
  - `dto/generar-recomendacion.dto.ts`: `usuarioId`, `plataformaIds` y `generoIds` obligatorios (al menos uno, sin repetidos), `caracteristicaIds` opcional.
  - `recomendacion.service.ts`: `generar` y los privados `buscarCandidatos`, `calcularPuntaje` y `buscarBusqueda`.
  - `recomendacion.controller.ts`: `POST /recomendaciones`.
  - `recomendacion.module.ts`: registra `Busqueda`, `Recomendacion`, `Juego`, `Usuario` y los tres catálogos de criterios con `TypeOrmModule.forFeature`.
- `src/app.module.ts`: se importó `RecomendacionModule`.
- Después de las pruebas se borraron los datos y se reiniciaron las secuencias de ids.

**Algoritmo:**
1. Valida que existan el usuario y los ids de los criterios (`400` si falta alguno).
2. Busca los candidatos con una consulta SQL: juegos que estén en al menos una de las plataformas elegidas y tengan al menos uno de los géneros elegidos, excluyendo con `NOT EXISTS` los que el usuario tiene como `YA_JUGADO` en su biblioteca.
3. Calcula el puntaje de cada candidato: 2 puntos por cada género en común y 1 por cada característica en común.
4. Ordena por puntaje (mayor primero); en caso de empate, por año de lanzamiento (más nuevo primero) y después por título. Se queda con los 3 primeros y les asigna `orden` 1, 2 y 3.
5. Si no hay candidatos responde `404` "No hay juegos que coincidan con los criterios elegidos" y no guarda nada.
6. Guarda la búsqueda con sus criterios y recomendaciones con un solo `save()`, y devuelve la búsqueda con las recomendaciones ordenadas y los datos completos de cada juego.

**Por qué:**
- Plataforma y género obligatorios, características opcionales: es lo mismo que exige un juego, así siempre hay con qué filtrar y puntuar.
- Plataforma y género son filtro (el juego tiene que coincidir en al menos uno de cada uno) para que las recomendaciones sean fieles a lo pedido. Se descartó que el género solo sumara puntos, porque podía recomendar un juego de otro género que coincidiera en características.
- El género pesa el doble que una característica porque es el criterio principal de la búsqueda. Los pesos y el máximo de 3 recomendaciones están en constantes al principio del service, para ajustarlos en un solo lugar.
- Desempate por año y título: el resultado es siempre el mismo para los mismos datos, lo que permite probarlo y explicarlo. Se descartó desempatar al azar.
- Los juegos `ME_INTERESA` sí se recomiendan: que le interesen no impide sugerirlos.
- Sin candidatos no se guarda la búsqueda, porque el modelo exige de 1 a 3 recomendaciones por búsqueda.
- `cascade: ['insert']` en `recomendaciones`: TypeORM inserta la búsqueda, sus criterios y sus recomendaciones en una misma transacción; o se guarda todo o nada.
- El filtrado se hace en SQL (para no traer juegos que no sirven) y el puntaje en TypeScript (más fácil de leer y de explicar; con el volumen del TP no afecta el rendimiento).
- Los `@Check` son una segunda barrera en la base: el orden lo asigna el código y la calificación la validará un DTO cuando se implemente.
- Reglas de borrado: si se borra el usuario, se borran sus búsquedas y recomendaciones; si se borra un juego, se borran sus recomendaciones (no se bloquea al administrador); si se borra un catálogo que ningún juego usa, sale de los criterios de las búsquedas viejas. Consecuencias aceptadas: al borrar un juego puede quedar un hueco en el `orden` de una búsqueda (por ejemplo 1 y 3), y una búsqueda podría quedar sin recomendaciones si se borraran todos sus juegos. Se tienen en cuenta para el historial del Paso 11.

**Requisito del TP que cubre:** CUU Generar recomendación personalizada, sin recomendar juegos marcados como `YA_JUGADO` (regularidad).

**Cómo probarlo:** con la API levantada (`npm run start:dev`), cargar este escenario (plataformas P1 y P2, géneros RPG, Acción y Puzzle, características Mundo abierto y Multijugador, un usuario). La última columna es el puntaje para la búsqueda P1 + {RPG, Acción} + {Mundo abierto}:

| Juego | Año | Plataformas | Géneros | Características | Puntaje |
|---|---|---|---|---|---|
| Alfa | 2020 | P1 | RPG, Acción | Mundo abierto | 5 |
| Beta | 2022 | P1 | RPG | Mundo abierto, Multijugador | 3 |
| Gamma | 2021 | P1 | RPG | Mundo abierto | 3 |
| Delta | 2023 | P1 | Acción | — | 2 |
| Epsilon | 2024 | P2 | RPG | — | (no está en P1) |
| Zeta | 2024 | P1 | Puzzle | — | (no tiene RPG ni Acción) |

| Request | Respuesta esperada |
|---|---|
| `POST /recomendaciones` `{"usuarioId": 1, "plataformaIds": [P1], "generoIds": [RPG, Acción], "caracteristicaIds": [Mundo abierto]}` | `201` con la búsqueda, sus criterios y las recomendaciones `1. Alfa`, `2. Beta`, `3. Gamma` (Beta gana el empate por ser más nuevo) |
| Marcar Alfa como `YA_JUGADO` y Beta como `ME_INTERESA` en `/biblioteca`, y repetir la búsqueda | `201` con `1. Beta`, `2. Gamma`, `3. Delta` |
| `POST /recomendaciones` `{"usuarioId": 1, "plataformaIds": [P2], "generoIds": [RPG]}` | `201` con una sola recomendación: `1. Epsilon` |
| `POST /recomendaciones` `{"usuarioId": 1, "plataformaIds": [P2], "generoIds": [Puzzle]}` | `404` `"No hay juegos que coincidan con los criterios elegidos"` (no se guarda la búsqueda) |
| `POST /recomendaciones` `{}` | `400` `["El usuario es obligatorio", "Debe elegir al menos una plataforma", "Debe elegir al menos un género"]` |
| `POST /recomendaciones` con `"plataformaIds": []` | `400` `["Debe elegir al menos una plataforma"]` |
| `POST /recomendaciones` con `"generoIds": [9999]` | `400` `"No existen los géneros con id: 9999"` |
| `POST /recomendaciones` con `"usuarioId": 9999` | `400` `"No existe el usuario con id 9999"` |
| `POST /recomendaciones` con `"plataformaIds": [P1, P1]` | `400` `["Las plataformas no pueden repetirse"]` |
| `DELETE /juegos/{Gamma}` y revisar las búsquedas en la base | Gamma desaparece de las recomendaciones de las búsquedas anteriores |
| Borrar el usuario en la base (`DELETE FROM usuario WHERE id = 1`) | Se borran en cascada sus búsquedas, recomendaciones, colecciones y biblioteca |

## Paso 11 - Listado de recomendaciones del usuario filtrado por fecha y detalle (2026-10-06)

**Qué se hizo:** Se agregó el historial de recomendaciones del usuario (`GET /recomendaciones?usuarioId=...&desde=...&hasta=...`), con filtro opcional por rango de fechas, y el detalle de una búsqueda (`GET /recomendaciones/:id`). Con este paso se completa el alcance de la regularidad.

**Cómo se hizo:**
- Rama `feature/historial-recomendaciones` creada desde `dev`.
- `src/comun/usuario-query.dto.ts`: se movió desde `src/juego-guardado/dto/` porque ahora lo usan la biblioteca y el historial. Se actualizaron los imports de `filtro-biblioteca.dto.ts` y `juego-guardado.controller.ts`.
- `src/recomendacion/dto/filtro-historial.dto.ts` (nuevo): extiende `UsuarioQueryDto` y agrega `desde` y `hasta` opcionales, con formato `AAAA-MM-DD` (`@Matches`) y fecha existente (`@IsISO8601({ strict: true })`).
- `src/recomendacion/recomendacion.service.ts`:
  - `listar(filtro)` (nuevo): valida el usuario (`404`) y el rango (`400`), y arma la consulta con `QueryBuilder`.
  - `buscarPorId(id)`: el antiguo método privado `buscarBusqueda` pasó a ser público con este nombre. Lo usan `generar` y el detalle.
  - Constante `ZONA_HORARIA = 'America/Argentina/Buenos_Aires'`.
- `src/recomendacion/recomendacion.controller.ts`: se agregaron `GET /recomendaciones` y `GET /recomendaciones/:id`.

**Por qué:**
- El listado devuelve búsquedas agrupadas (fecha, criterios y sus 1 a 3 recomendaciones) en lugar de recomendaciones sueltas, para ver juntos qué se pidió y qué se recomendó. Se ordena de la búsqueda más reciente a la más vieja, y dentro de cada una por `orden`.
- En el listado, cada juego viene resumido (id, título, año e imagen) para que la respuesta no sea pesada. El detalle completo (descripción, clasificación, plataformas, géneros y características) está en `GET /recomendaciones/:id`, que devuelve lo mismo que el `POST`.
- Las búsquedas que se quedaron sin recomendaciones (porque se borraron todos sus juegos, ver Paso 10) no aparecen en el listado: se usa `innerJoin` con las recomendaciones. El detalle por id sí las devuelve, con la lista vacía.
- Las fechas se reciben solo como fecha (`AAAA-MM-DD`), sin hora. `strict` rechaza fechas inexistentes como `2026-02-30`. Que `desde` no sea posterior a `hasta` se controla en el service porque compara dos campos.
- Los dos extremos del rango son días completos: `desde` toma desde las 00:00 y `hasta` hasta antes de las 00:00 del día siguiente.
- Zona horaria: la base guarda las fechas en UTC, así que una búsqueda hecha el 5/10 a las 23:30 en Argentina queda como 6/10 02:30 UTC. Si se filtrara en UTC, aparecería en el día equivocado. PostgreSQL convierte los límites a hora de Argentina con `AT TIME ZONE`. Las fechas y la zona van como parámetros de la consulta, no concatenadas en el SQL.
- Las fechas se devuelven en UTC (formato ISO con `Z`): el frontend las muestra en hora local (con `new Date(...)` la conversión es automática).
- Sin resultados se responde `200` con `[]`. Si el usuario no existe, `404`, igual que en la biblioteca.
- El detalle todavía no controla que la búsqueda sea del usuario que la consulta; se agrega con el login.

**Requisito del TP que cubre:** Listado de recomendaciones del usuario filtrado por fecha y detalle (regularidad).

**Cómo probarlo:** con la API levantada (`npm run start:dev`), generar búsquedas con `POST /recomendaciones` y, para probar fechas distintas, cambiarlas en la base (`UPDATE busqueda SET fecha_busqueda = '...' WHERE id = ...`). Escenario usado (usuario 1 salvo b5, que es del usuario 2):

| Búsqueda | Fecha en Argentina | Fecha en UTC (base) |
|---|---|---|
| b1 | 01/10 12:00 | 2026-10-01T15:00:00Z |
| b2 | 03/10 12:00 | 2026-10-03T15:00:00Z |
| b3 | 05/10 23:30 | 2026-10-06T02:30:00Z |
| b4 | 06/10 00:30 | 2026-10-06T03:30:00Z |
| b5 (usuario 2) | 03/10 12:00 | 2026-10-03T15:00:00Z |
| b6 (sin recomendaciones) | 04/10 12:00 | 2026-10-04T15:00:00Z |

| Request | Respuesta esperada |
|---|---|
| `GET /recomendaciones?usuarioId=1` | `200` con b4, b3, b2, b1 (b6 no aparece) |
| `GET /recomendaciones?usuarioId=1&desde=2026-10-03` | `200` con b4, b3, b2 |
| `GET /recomendaciones?usuarioId=1&hasta=2026-10-05` | `200` con b3, b2, b1 (b3 es del 5/10 en hora de Argentina) |
| `GET /recomendaciones?usuarioId=1&desde=2026-10-05&hasta=2026-10-05` | `200` con solo b3 |
| `GET /recomendaciones?usuarioId=1&desde=2026-10-06` | `200` con solo b4 |
| `GET /recomendaciones?usuarioId=1&desde=2026-10-06&hasta=2026-10-01` | `400` `"La fecha desde no puede ser posterior a la fecha hasta"` |
| `GET /recomendaciones?usuarioId=1&desde=2026-02-30` | `400` `["La fecha desde no es una fecha válida"]` |
| `GET /recomendaciones?usuarioId=1&desde=06/10/2026` | `400` `["La fecha desde debe tener el formato AAAA-MM-DD"]` |
| `GET /recomendaciones` | `400` `["El usuario es obligatorio"]` |
| `GET /recomendaciones?usuarioId=9999` | `404` `"No se encontró el usuario con id 9999"` |
| `GET /recomendaciones?usuarioId=2` | `200` con solo b5 |
| `GET /recomendaciones?usuarioId=1&desde=2025-01-01&hasta=2025-12-31` | `200` `[]` |
| `GET /recomendaciones/{b1}` | `200` con los criterios y las recomendaciones con el juego completo |
| `GET /recomendaciones/9999` | `404` `"No se encontró la búsqueda con id 9999"` |
| `GET /recomendaciones/{b6}` | `200` con `"recomendaciones": []` |
| `GET /biblioteca` (sin `usuarioId`) | `400` `["El usuario es obligatorio"]` (la biblioteca sigue funcionando con el DTO movido a `src/comun/`) |

## Paso 12 - CUU Administrar colección (2026-10-06)

**Qué se hizo:** Caso de uso para administrar los juegos de una colección de a uno: agregar un juego (`POST /colecciones/:id/juegos`) y quitarlo (`DELETE /colecciones/:id/juegos/:juegoId`). Completa el CRUD del Paso 7, donde los juegos solo se podían cambiar reemplazando la lista entera.

**Cómo se hizo:**
- Rama `feature/administrar-coleccion` creada desde `dev`.
- `src/coleccion/dto/agregar-juego.dto.ts` (nuevo): `juegoId` obligatorio y entero.
- `src/coleccion/coleccion.service.ts`: métodos `agregarJuego` y `quitarJuego`.
- `src/coleccion/coleccion.controller.ts`: rutas `POST /colecciones/:id/juegos` y `DELETE /colecciones/:id/juegos/:juegoId`.

**Por qué:**
- Rutas como subrecurso de la colección (`/colecciones/:id/juegos`): expresan "los juegos de esta colección" y corresponden a las acciones de la pantalla ("agregar a la colección", "quitar de la colección"), sin que el frontend tenga que mandar la lista completa. El `PATCH` con `juegoIds` se mantiene para reemplazar la lista entera.
- Códigos de error: si la colección no existe, `404`. Al agregar, el juego viene en el body: si no existe es `400`, y si ya está en la colección `409`. Al quitar, el juego viene en la URL: si no está en la colección, `404`.
- `createQueryBuilder().relation(Coleccion, 'juegos').of(id).add()` / `.remove()` de TypeORM: insertan o borran solo la fila de `coleccion_juego`, sin cargar y volver a guardar toda la colección. Para saber si el juego ya está se usa `buscarPorId`, que ya trae la colección con sus juegos.
- Si llegan dos pedidos iguales al mismo tiempo, la clave primaria de `coleccion_juego` frena el segundo y el filtro global lo convierte en `409`.
- Igual que en el resto del CRUD de colecciones, no se pide `usuarioId`: el control de que la colección sea del usuario que la modifica se agrega con el login.

**Requisito del TP que cubre:** CUU Administrar colección (aprobación).

**Cómo probarlo:** con la API levantada (`npm run start:dev`), tres juegos (1, 2 y 3) y una colección 1 que tiene el juego 1:

| Request | Respuesta esperada |
|---|---|
| `POST /colecciones/1/juegos` `{"juegoId": 2}` | `201` con la colección y los juegos 1 y 2 |
| Repetir el mismo `POST` | `409` `"El juego ya está en la colección"` |
| `POST /colecciones/1/juegos` `{"juegoId": 9999}` | `400` `"No existe el juego con id 9999"` |
| `POST /colecciones/1/juegos` `{}` | `400` `["El juego es obligatorio"]` |
| `POST /colecciones/1/juegos` `{"juegoId": "abc"}` | `400` `["El juego debe ser un id entero"]` |
| `POST /colecciones/9999/juegos` `{"juegoId": 2}` | `404` `"No se encontró la colección con id 9999"` |
| `DELETE /colecciones/1/juegos/1` | `204` sin contenido; la colección queda solo con el juego 2 |
| Repetir el mismo `DELETE` | `404` `"El juego no está en la colección"` |
| `DELETE /colecciones/1/juegos/3` (nunca estuvo) | `404` `"El juego no está en la colección"` |
| `DELETE /colecciones/9999/juegos/1` | `404` `"No se encontró la colección con id 9999"` |
| `DELETE /colecciones/abc/juegos/1` o `/colecciones/1/juegos/abc` | `400` `"El id debe ser un número entero"` |
| `PATCH /colecciones/1` `{"juegoIds": [1, 3]}` | `200`, la lista entera se reemplaza por los juegos 1 y 3 |

## Paso 13 - CUU Consultar historial de recomendaciones (2026-10-06)

**Qué se hizo:** Se completó el caso de uso del historial. La consulta (listado filtrado por fecha y detalle) ya existía desde el Paso 11; se agregó que el usuario califique cada juego recomendado de 1 a 5 con un comentario opcional (`PATCH /recomendaciones/:busquedaId/juegos/:juegoId`) y que borre una búsqueda de su historial (`DELETE /recomendaciones/:id`).

**Cómo se hizo:**
- Rama `feature/consultar-historial` creada desde `dev`.
- `src/recomendacion/dto/calificar-recomendacion.dto.ts` (nuevo): `calificacion` obligatoria, entera, entre 1 y 5; `comentario` opcional, sin espacios en los extremos, hasta 500 caracteres.
- `src/recomendacion/recomendacion.service.ts`: se inyectó el repositorio de `Recomendacion` y se agregaron `calificar`, `eliminar` y el privado `validarBusquedaExiste`.
- `src/recomendacion/recomendacion.controller.ts`: rutas `PATCH /recomendaciones/:busquedaId/juegos/:juegoId` y `DELETE /recomendaciones/:id`.

**Por qué:**
- La recomendación a calificar se identifica por búsqueda y juego (subrecurso de la búsqueda, igual que los juegos de una colección): el frontend ya tiene ambos ids en la pantalla del detalle, y la combinación es única (restricción del Paso 10). Se descartó una ruta por id de recomendación porque mezclaba en `/recomendaciones/...` ids de búsqueda y de recomendación.
- La calificación es entera de 1 a 5 (se rechazan `4.5` y `"4"`). Además del DTO, el `CHECK` de la tabla queda como segunda barrera.
- Se puede recalificar: se reemplaza la calificación y `fecha_calificacion` toma la fecha y hora del momento. Si el comentario no viene, se mantiene el anterior (así se puede cambiar solo la calificación); si viene `null` o vacío, se borra. Un comentario de solo espacios se guarda como `null` para no dejar textos vacíos en la base.
- Códigos de error: búsqueda inexistente `404`; juego que no está entre las recomendaciones de esa búsqueda `404`; datos inválidos `400`.
- Borrar una búsqueda usa `delete()` (un `DELETE` directo) en lugar de `remove()`: no hace falta cargarla con sus relaciones, y PostgreSQL borra en cascada sus recomendaciones y los criterios de las tablas intermedias. Los juegos no se tocan.
- No se pide `usuarioId`: el control de que la búsqueda sea del usuario que la califica o la borra se agrega con el login.

**Requisito del TP que cubre:** CUU Consultar historial de recomendaciones (aprobación).

**Cómo probarlo:** con la API levantada (`npm run start:dev`), un usuario y dos búsquedas: la 1 recomienda los juegos 1 y 2, y la 2 recomienda el juego 3:

| Request | Respuesta esperada |
|---|---|
| `PATCH /recomendaciones/1/juegos/1` `{"calificacion": 4, "comentario": "  Muy bueno  "}` | `200` con `"calificacion": 4`, `"comentario": "Muy bueno"`, `fechaCalificacion` y el juego completo |
| `PATCH /recomendaciones/1/juegos/1` `{"calificacion": 5}` | `200` con calificación 5; el comentario sigue siendo `"Muy bueno"` y la fecha se actualiza |
| `PATCH /recomendaciones/1/juegos/1` `{"calificacion": 5, "comentario": null}` (o `"   "`) | `200` con `"comentario": null` |
| `PATCH /recomendaciones/1/juegos/2` `{"calificacion": 0}` (o `6`) | `400` `["La calificación debe estar entre 1 y 5"]` |
| `PATCH /recomendaciones/1/juegos/2` `{"calificacion": 4.5}` (o `"4"`) | `400` `["La calificación debe ser un número entero"]` |
| `PATCH /recomendaciones/1/juegos/2` `{}` | `400` `["La calificación es obligatoria"]` |
| `PATCH /recomendaciones/1/juegos/2` con un comentario de 501 caracteres | `400` `["El comentario no puede superar los 500 caracteres"]` |
| `PATCH /recomendaciones/1/juegos/3` (el juego 3 está en la búsqueda 2) | `404` `"El juego no está entre las recomendaciones de la búsqueda"` |
| `PATCH /recomendaciones/9999/juegos/1` | `404` `"No se encontró la búsqueda con id 9999"` |
| `PATCH /recomendaciones/abc/juegos/1` | `400` `"El id debe ser un número entero"` |
| `GET /recomendaciones?usuarioId=1` y `GET /recomendaciones/1` | `200`, cada recomendación muestra su `calificacion` y `comentario` |
| `DELETE /recomendaciones/1` | `204` sin contenido |
| `GET /recomendaciones/1` después de borrarla | `404` `"No se encontró la búsqueda con id 1"` |
| `GET /recomendaciones?usuarioId=1` después de borrarla | `200` con solo la búsqueda 2 |
| Repetir `DELETE /recomendaciones/1` | `404` `"No se encontró la búsqueda con id 1"` |

## Paso 14 - CRUD Usuario (2026-10-06)

**Qué se hizo:** Se completó el CRUD de Usuario. Al registro y la consulta por id (Paso 7) se sumaron el listado (`GET /usuarios`), la edición de datos (`PATCH /usuarios/:id`), el cambio de contraseña (`PATCH /usuarios/:id/contrasena`) y la baja (`DELETE /usuarios/:id`).

**Cómo se hizo:**
- Rama `feature/crud-usuario` creada desde `dev`.
- `src/usuario/dto/actualizar-usuario.dto.ts` (nuevo): `PartialType(OmitType(CrearUsuarioDto, ['contrasena']))`, es decir nombre, apellido, email y plataforma favorita, todos opcionales y con las mismas validaciones del registro.
- `src/usuario/dto/cambiar-contrasena.dto.ts` (nuevo): `contrasenaActual` obligatoria y `contrasenaNueva` de 8 a 72 caracteres.
- `src/usuario/usuario.service.ts`: métodos `listar`, `actualizar`, `cambiarContrasena` y `eliminar`. Se importó `compare` de bcryptjs.
- `src/usuario/usuario.controller.ts`: rutas `GET /usuarios`, `PATCH /usuarios/:id`, `PATCH /usuarios/:id/contrasena` y `DELETE /usuarios/:id`.

**Por qué:**
- La contraseña se cambia en una ruta aparte y exige la contraseña actual, que se compara con el hash guardado (`compare` de bcryptjs). Hasta que haya login, es lo que impide que cualquiera cambie la contraseña de otro usuario. La nueva tiene las mismas reglas del registro y no puede ser igual a la actual. La respuesta es `204` sin contenido.
- El `PATCH` de datos no acepta `contrasena` ni `rol`: el `whitelist` los descarta. El cambio de rol va a ser una acción de administrador con el login.
- El email se normaliza a minúsculas (igual que en el registro) y no puede repetirse con otro usuario (`409`); guardar el propio email no es conflicto.
- `"plataformaId": null` deja al usuario sin plataforma favorita; un id inexistente responde `400`.
- El hash nunca sale en una respuesta: la columna tiene `select: false` y solo se pide explícitamente (`addSelect`) en el cambio de contraseña para compararlo. La nueva se guarda con `update()`, que modifica solo esa columna.
- Si llega `"email": null` no se busca un duplicado (TypeORM 1.0 da error con `null` en el `where`); el `null` llega a la base, que lo rechaza, y el filtro global responde `400` "Falta un dato obligatorio".
- La baja usa `delete()`: PostgreSQL borra en cascada las colecciones, búsquedas, recomendaciones y biblioteca del usuario. Los juegos no se tocan.
- El listado y la baja van a quedar solo para administradores cuando se implemente el login; por ahora están abiertos como el resto de la API.
- Nota para quien pruebe con scripts: el `fetch` de Node reutiliza conexiones, y Express cierra las que quedan inactivas más de 5 segundos. Si el script hace una pausa larga entre requests puede aparecer `ECONNRESET`; no es un error de la API (se resuelve reintentando). Con el navegador o Postman no pasa.

**Requisito del TP que cubre:** CRUD Usuario (aprobación).

**Cómo probarlo:** con la API levantada (`npm run start:dev`), dos plataformas (1 y 2) y dos usuarios: 1 (Ana Zapata, contraseña `claveVieja1`, plataforma 1) y 2 (Beto Alvarez, `beto@mail.com`):

| Request | Respuesta esperada |
|---|---|
| `GET /usuarios` | `200` con Beto Alvarez y Ana Zapata (por apellido), con su plataforma y sin `contrasenaHash` |
| `PATCH /usuarios/1` `{"nombre": "Anita", "email": "  ANITA@Mail.com "}` | `200` con `"nombre": "Anita"` y `"email": "anita@mail.com"` |
| `PATCH /usuarios/1` `{"email": "beto@mail.com"}` | `409` `"Ya existe un usuario con el email 'beto@mail.com'"` |
| `PATCH /usuarios/1` `{"email": "anita@mail.com"}` (su propio email) | `200` |
| `PATCH /usuarios/1` `{"plataformaId": 2}` | `200` con la plataforma 2 |
| `PATCH /usuarios/1` `{"plataformaId": null}` | `200` con `"plataforma": null` |
| `PATCH /usuarios/1` `{"plataformaId": 9999}` | `400` `"No existe la plataforma con id 9999"` |
| `PATCH /usuarios/1` `{"email": "no-es-email"}` | `400` `["El email no es válido"]` |
| `PATCH /usuarios/1` `{"nombre": ""}` | `400` `["El nombre es obligatorio"]` |
| `PATCH /usuarios/1` `{"email": null}` | `400` `"Falta un dato obligatorio"` |
| `PATCH /usuarios/1` `{"rol": "ADMIN", "contrasena": "x"}` | `200`, se ignoran: el rol sigue siendo `USUARIO` y la contraseña no cambia |
| `PATCH /usuarios/9999` | `404` `"No se encontró el usuario con id 9999"` |
| `PATCH /usuarios/1/contrasena` `{"contrasenaActual": "claveVieja1", "contrasenaNueva": "claveNueva2"}` | `204` sin contenido; el hash en la base cambia |
| `PATCH /usuarios/1/contrasena` con `"contrasenaActual": "cualquiera"` | `400` `"La contraseña actual es incorrecta"` |
| `PATCH /usuarios/1/contrasena` `{"contrasenaActual": "claveNueva2", "contrasenaNueva": "claveNueva2"}` | `400` `"La contraseña nueva debe ser distinta de la actual"` |
| `PATCH /usuarios/1/contrasena` con `"contrasenaNueva": "12345"` | `400` `["La contraseña nueva debe tener al menos 8 caracteres"]` |
| `PATCH /usuarios/1/contrasena` `{}` | `400` `["La contraseña actual es obligatoria", "La contraseña nueva es obligatoria"]` |
| `PATCH /usuarios/1/contrasena` con la contraseña vieja (`claveVieja1`) | `400` `"La contraseña actual es incorrecta"` |
| `DELETE /usuarios/1` | `204` sin contenido; se borran en cascada su colección, búsqueda, recomendaciones y biblioteca |
| `GET /usuarios/1` o repetir el `DELETE` | `404` `"No se encontró el usuario con id 1"` |
| `GET /usuarios` | `200` con solo Beto Alvarez |

## Paso 15 - Login con 2 niveles de acceso y protección de rutas (2026-10-06)

**Qué se hizo:** Se agregó el inicio de sesión con JWT (`POST /auth/login`) y la protección de todas las rutas: por defecto piden un token válido, algunas son públicas y otras son solo para administradores. Hay dos niveles de acceso, `USUARIO` y `ADMIN`. Al arrancar, la API crea el primer administrador con los datos del `.env`. El reemplazo del `usuarioId` temporal por el usuario del token en colecciones, biblioteca y recomendaciones queda para el Paso 16.

**Cómo se hizo:**
- Rama `feature/login` creada desde `dev`.
- `npm install @nestjs/jwt` (versión 12.0.2): paquete oficial de NestJS para firmar y verificar tokens JWT.
- `.env.example`: variables `JWT_SECRET`, `JWT_EXPIRACION` (`8h`), `ADMIN_EMAIL` y `ADMIN_CONTRASENA`.
- Archivos nuevos en `src/auth/`:
  - `usuario-token.interface.ts`: tipos `UsuarioToken` (`id`, `email`, `rol`) y `ContenidoToken` (`sub`, `email`, `rol`).
  - `decoradores/publico.decorator.ts`, `decoradores/roles.decorator.ts`, `decoradores/usuario-actual.decorator.ts`: `@Publico()`, `@Roles(...)` y `@UsuarioActual()`.
  - `guards/autenticacion.guard.ts`: exige `Authorization: Bearer <token>` salvo en rutas `@Publico()`; verifica firma y vencimiento y deja el usuario en `request.usuario`.
  - `guards/roles.guard.ts`: en rutas con `@Roles(...)`, responde `403` si el rol no está permitido.
  - `verificar-acceso.ts`: función `verificarAcceso(usuarioActual, propietarioId)` que deja pasar al dueño del recurso o a un ADMIN y si no responde `403`.
  - `dto/login.dto.ts`, `auth.service.ts`, `auth.controller.ts`: el login.
  - `crear-admin.service.ts`: crea el primer administrador al arrancar (`OnApplicationBootstrap`).
  - `auth.module.ts`: configura `JwtModule` (global) con `JWT_SECRET` y `JWT_EXPIRACION`, y registra los dos guards como globales (`APP_GUARD`).
- `src/app.module.ts`: se importó `AuthModule`.
- Controllers de género, plataforma, característica, clasificación de edad y juego: `@Publico()` en los `GET` y `@Roles(Rol.ADMIN)` en `POST`, `PATCH` y `DELETE`.
- `src/app.controller.ts`: `@Publico()` en `GET /`.
- Usuario:
  - `dto/cambiar-rol.dto.ts` (nuevo): `rol` obligatorio (`USUARIO` o `ADMIN`).
  - `usuario.controller.ts`: registro público; `GET /usuarios` y la nueva `PATCH /usuarios/:id/rol` solo ADMIN; el resto recibe `@UsuarioActual()` y se lo pasa al service.
  - `usuario.service.ts`: control de acceso con `verificarAcceso`, método `cambiarRol`, protección del último administrador y `RONDAS_HASH` exportada.

**Quién puede hacer qué:**

| Ruta | Acceso |
|---|---|
| `POST /auth/login`, `POST /usuarios` (registro), `GET /` | Pública |
| `GET` de géneros, plataformas, características, clasificaciones de edad y juegos | Pública |
| `POST`, `PATCH` y `DELETE` de géneros, plataformas, características, clasificaciones de edad y juegos | Solo ADMIN |
| `GET /usuarios`, `PATCH /usuarios/:id/rol` | Solo ADMIN |
| `GET`, `PATCH` y `DELETE /usuarios/:id` | El propio usuario o un ADMIN |
| `PATCH /usuarios/:id/contrasena` | Solo el propio usuario |
| Colecciones, biblioteca y recomendaciones | Cualquier usuario con sesión iniciada (el control de dueño llega en el Paso 16) |

**Por qué:**
- JWT: el token va firmado con `JWT_SECRET` y lleva el id, email y rol del usuario, así la API verifica quién es sin consultar la base en cada pedido. Se usó `@nestjs/jwt` con guards propios en lugar de Passport: es la forma que muestra la documentación de NestJS y deja menos código "mágico" para explicar.
- Guards globales con `@Publico()` como excepción: una ruta nueva queda protegida por defecto, y hay que marcar a propósito las que son públicas. El de autenticación corre antes que el de roles porque este necesita saber quién es el usuario.
- El login responde `401` con el mismo mensaje ("Email o contraseña incorrectos") si el email no existe o si la contraseña no coincide, para no revelar qué emails están registrados. Responde `200` (no `201`) porque no crea ningún recurso.
- Los `GET` de juegos y catálogos son públicos para poder mostrar el catálogo y los filtros sin iniciar sesión; modificarlos es solo de ADMIN.
- Acceso a recursos de otro usuario: `403` "No tiene permiso para acceder a este recurso" (se eligió en lugar de `404` por ser más explícito). El control se hace en el service con `verificarAcceso`, para que el controller siga sin lógica.
- El cambio de contraseña es solo del propio usuario, porque exige la contraseña actual, que un ADMIN no conoce.
- Primer administrador desde el `.env`: funciona igual en local, en Supabase y en el deploy, sin tocar la base a mano. Si ya hay un ADMIN no hace nada; si el email ya está registrado, a ese usuario le asigna el rol ADMIN; si faltan las variables o la contraseña no tiene entre 8 y 72 caracteres, avisa en la consola sin impedir que la API arranque.
- Si falta `JWT_SECRET`, la API no arranca ("Falta la variable de entorno JWT_SECRET en el .env"), para no firmar tokens sin clave.
- No se puede quitar el rol ni borrar al último ADMIN (`409`), para que la API no se quede sin administradores.
- Limitación conocida: si a alguien le cambian el rol, su token actual sigue con el rol anterior hasta que vence (`JWT_EXPIRACION`) o hasta que vuelve a iniciar sesión. Es el funcionamiento normal de los JWT.

**Requisito del TP que cubre:** Login con 2 niveles de acceso y protección de rutas (aprobación).

**Cómo probarlo:** completar en el `.env` `JWT_SECRET` (por ejemplo, con `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`), `JWT_EXPIRACION=8h`, `ADMIN_EMAIL` y `ADMIN_CONTRASENA`. Al correr `npm run start:dev`, la consola muestra `[CrearAdmin] Se creó el administrador <ADMIN_EMAIL>` (solo la primera vez). Para usar un token en Postman: hacer el login, copiar el `token` de la respuesta y mandarlo en el header `Authorization: Bearer <token>` (pestaña Authorization, tipo "Bearer Token").

| Request | Respuesta esperada |
|---|---|
| `GET /`, `GET /juegos`, `GET /generos` sin token | `200` |
| `POST /generos` sin token | `401` `"Debe iniciar sesión"` |
| `POST /generos` con un token vencido, inventado o firmado con otra clave | `401` `"La sesión no es válida o expiró"` |
| `POST /auth/login` con un email que no existe o con la contraseña incorrecta | `401` `"Email o contraseña incorrectos"` |
| `POST /auth/login` `{"email": "no-es-email"}` | `400` `["El email no es válido", "La contraseña es obligatoria"]` |
| `POST /auth/login` con `ADMIN_EMAIL` (en mayúsculas o con espacios también) y `ADMIN_CONTRASENA` | `200` con `token` y `usuario` (`"rol": "ADMIN"`), sin hash |
| `POST /usuarios` (registro, sin token) y `POST /auth/login` con ese usuario | `201` y `200` con `"rol": "USUARIO"` |
| `POST /generos` con token de USUARIO (también `PATCH` y `DELETE` de catálogos y juegos) | `403` `"No tiene permiso para realizar esta acción"` |
| `POST /generos`, `/plataformas`, `/clasificaciones-edad`, `/juegos` con token de ADMIN | `201` |
| `GET` y `PATCH /usuarios/{propio id}` con token de USUARIO | `200` |
| `GET`, `PATCH` o `DELETE /usuarios/{id de otro}` con token de USUARIO | `403` `"No tiene permiso para acceder a este recurso"` |
| `GET /usuarios/{id}` sin token | `401` `"Debe iniciar sesión"` |
| `GET /usuarios` con token de USUARIO / de ADMIN | `403` / `200` |
| `PATCH /usuarios/{id de otro}/contrasena` con token de ADMIN | `403` |
| `PATCH /usuarios/{propio id}/contrasena` con la contraseña actual correcta | `204`; después el login funciona con la nueva |
| `PATCH /usuarios/{id del admin}/rol` `{"rol": "USUARIO"}` siendo el único ADMIN (o `DELETE` de su usuario) | `409` `"No se puede quitar el rol al último administrador"` |
| `PATCH /usuarios/{id}/rol` `{"rol": "JEFE"}` con token de ADMIN | `400` `["El rol debe ser USUARIO o ADMIN"]` |
| `PATCH /usuarios/{id}/rol` `{"rol": "ADMIN"}` con token de ADMIN | `200` con el rol nuevo; el usuario tiene que volver a iniciar sesión para usarlo |
| `PATCH /usuarios/{id}/rol` con token de USUARIO | `403` |
| `GET /colecciones`, `GET /biblioteca`, `POST /recomendaciones` sin token | `401` `"Debe iniciar sesión"` |
| Volver a arrancar la API con el admin ya creado | No crea otro administrador ni muestra el mensaje |
