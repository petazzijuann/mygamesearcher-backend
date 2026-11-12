# Recomendaciones por sistema y por IA

## Configuración

Node >=20. No se agregaron dependencias: se usa fetch nativo con timeout de 30 segundos.
En el `.env` del backend (nunca en Vite):

```dotenv
GROQ_API_KEY=tu_clave_privada
GROQ_MODEL=openai/gpt-oss-20b
```

El modelo predeterminado es `openai/gpt-oss-20b`. También se admite `openai/gpt-oss-120b`; otros valores se rechazan antes de llamar al proveedor porque no se verificó su compatibilidad. La documentación oficial lista ambos con JSON Schema estricto:
- https://console.groq.com/docs/models
- https://console.groq.com/docs/structured-outputs

La disponibilidad para una cuenta depende de sus permisos y cuota. Una clave ausente no impide iniciar el backend ni usar SISTEMA. No se registran claves, prompts ni respuestas del proveedor en logs. No hay reintentos automáticos ni sustitución por sistema.

## Persistencia y despliegue

Se agregan `busqueda.tipo` (varchar(7), default SISTEMA) y `recomendacion.motivo` (varchar(500), nullable). Las búsquedas previas conservan sus relaciones y calificaciones; se identifican como SISTEMA y su motivo queda null.

En producción, aplicar antes del despliegue `docs/sql/2026-11-12-recomendaciones-ia.sql` sobre la base correspondiente. El script es aditivo y no borra filas. No se ejecutó durante la implementación. En desarrollo sigue vigente el synchronize existente de TypeORM, que agrega las columnas al iniciar. No se inició la aplicación contra una base durante las pruebas automatizadas.

## Contrato y flujo

Se conserva `POST /recomendaciones`, protegido por JWT. Body de ejemplo (usar IDs reales):

```json
{
  "tipo": "IA",
  "plataformaIds": [1],
  "generoIds": [2],
  "caracteristicaIds": []
}
```

Omitir `tipo` equivale a SISTEMA. Se conserva la validación existente: al menos una plataforma y un género; características opcionales. Los IDs se validan contra PostgreSQL.

- SISTEMA mantiene el filtro por alguna plataforma y algún género, excluye YA_JUGADO, pondera 2 por género y 1 por característica, desempata por año descendente y título, y devuelve hasta 3. No se cambió `elegir-recomendados.ts`.
- IA reutiliza la consulta por plataformas y exclusión de YA_JUGADO, sin exigir coincidencia de género. Géneros y características se usan como preferencias. Sobre esos candidatos se priorizan coincidencias con la misma función de puntaje, se desempata por ID y se envían como máximo 30. No se envían datos del usuario, descripciones, imágenes ni la biblioteca. Se acotan listas de etiquetas a 50 y nombres a 100 caracteres.
- Groq recibe IDs y nombres reales, un prompt en español y un JSON Schema estricto con los IDs permitidos. La salida se valida nuevamente: finalización completa, entre 1 y 3 resultados, IDs enteros del conjunto enviado, sin duplicados, motivo no vacío y hasta 500 caracteres.
- Solo tras validar se guarda la búsqueda con usuario, tipo, orden y motivos mediante la transacción en cascada existente. No se guarda una búsqueda fallida.
- Se devuelve la búsqueda con los juegos completos, `tipo` y cada `motivo`. El frontend reutiliza las tarjetas, imágenes, enlaces y biblioteca. Historial y detalle muestran la modalidad; el detalle conserva explicaciones y permite calificar como antes.

El límite de 30 acota lo enviado a Groq; la consulta todavía carga los candidatos compatibles en memoria, como el recomendador existente. Para catálogos grandes puede trasladarse la preselección a SQL.

## Errores

404: sin candidatos. 429: cuota/rate limit. 502: respuesta inválida/incompleta. 503: clave ausente o rechazada, modelo incompatible, red o proveedor no disponible. 504: timeout. Los errores del proveedor no se propagan textualmente y un 401 de Groq se traduce a 503 para no cerrar la sesión JWT del usuario. El usuario puede volver a enviar el formulario o cambiar de modalidad.

## Prueba manual

1. Aplicar el esquema según el entorno, configurar las variables y arrancar backend con `npm run start:dev` y frontend con `npm run dev`.
2. Iniciar sesión, abrir Recomendame y elegir plataforma, género y opcionalmente características.
3. Generar con sistema (selección inicial). Comprobar el ranking habitual y la exclusión de YA_JUGADO.
4. Cambiar a IA: comprobar carga, de 1 a 3 juegos reales, explicación en español y enlace al detalle. Si solo hay juegos de otros géneros en la plataforma, siguen siendo candidatos de IA.
5. Abrir historial y recargar el detalle: comprobar tipo y motivos persistidos; calificar un juego.
6. Probar una plataforma sin candidatos; probar sin clave o con clave inválida y reintentar o cambiar a sistema. No debe guardarse una búsqueda fallida ni aparecer un resultado sustituto.

## Verificación automatizada

Backend: `npm test -- --runInBand`, `npm run build`, `npx eslint "{src,apps,libs,test}/**/*.ts"` y `npm run docs:openapi` (preview sin conexión a base).
Frontend: `npm test`, `npm run build` y `npm run lint`.

Los tests mockean fetch/Groq y repositorios: no consumen API real. Cubren ranking original, selección por modalidad, consulta de plataformas/exclusión, persistencia, contrato del DTO, prompt acotado, IDs inventados/duplicados, respuestas truncadas, errores HTTP/red/timeout y selección/carga/resultados/errores de interfaz. La integración real con PostgreSQL y una cuenta Groq requiere la prueba manual anterior.

## Archivos

Backend nuevos: `src/recomendacion/groq.service.ts`, `groq.service.spec.ts`, `recomendacion.service.spec.ts`, `tipo-recomendacion.enum.ts`, este documento y `docs/sql/2026-11-12-recomendaciones-ia.sql`.
Backend adaptados: DTO de generación, controller/module/service/entity de recomendaciones, entity de búsqueda, `src/comun/documentacion.ts`, `.env.example`, README y `docs/openapi.json`.
Frontend nuevo: `src/pages/Recomendar/Recomendar.test.tsx`.
Frontend adaptados: Recomendar, DetalleRecomendacion, HistorialRecomendaciones, tipos busqueda/recomendacion, `src/services/api.ts`, README y copia `docs/api/openapi.json`.
