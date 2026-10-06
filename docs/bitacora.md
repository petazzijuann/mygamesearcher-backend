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
- Código `23502`: `PartialType` marca los campos con `@IsOptional()`, que también deja pasar `null` sin validar. Antes, un `PATCH /generos/1` con `{"nombre": null}` respondía `500`; ahora responde `400`. En Juego, los `null` en `clasificacionEdadId`, `plataformaIds` y `generoIds` se controlan en el service, porque TypeORM ignora un `null` dentro de un `where` y podría devolver un registro cualquiera.

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
