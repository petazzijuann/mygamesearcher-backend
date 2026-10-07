import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';

// Ruta de la documentación interactiva: http://localhost:3000/api
// (el JSON de OpenAPI queda en /api-json)
export const RUTA_DOCUMENTACION = 'api';

// Arma el documento OpenAPI de la API. Lo usan la API (configurarSwagger)
// y el script que exporta docs/openapi.json (generar-openapi.ts).
// Los esquemas de los DTOs los genera el plugin de @nestjs/swagger (nest-cli.json)
// a partir de los tipos y de las validaciones de class-validator
export function crearDocumento(app: INestApplication): OpenAPIObject {
  const configuracion = new DocumentBuilder()
    .setTitle('DGame (MyGameSearcher) API')
    .setDescription(
      'API REST que recomienda de 1 a 3 videojuegos según géneros, características y plataforma.\n\n' +
        '**Cómo autenticarse:** hacer `POST /auth/login` con email y contraseña, copiar el `token` de la respuesta ' +
        'y pegarlo en el botón **Authorize** (arriba a la derecha). Desde ahí, todas las pruebas se mandan con ' +
        '`Authorization: Bearer <token>`.\n\n' +
        '**Niveles de acceso:** público (sin token), usuario con sesión iniciada, y ADMIN. ' +
        'El resumen de cada ruta indica quién puede usarla.\n\n' +
        '**Errores:** todas las respuestas de error tienen la forma `{ "statusCode", "message", "error" }`, ' +
        'con el mensaje en español. 400: datos inválidos · 401: sin sesión o token inválido · ' +
        '403: sin permiso · 404: no existe · 409: conflicto (duplicado o en uso).',
    )
    .setVersion('1.0')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      description: 'Token que devuelve POST /auth/login',
    })
    .build();

  return SwaggerModule.createDocument(app, configuracion);
}

// Publica la documentación interactiva (Swagger UI) en /api
export function configurarSwagger(app: INestApplication): void {
  SwaggerModule.setup(RUTA_DOCUMENTACION, app, crearDocumento(app), {
    customSiteTitle: 'DGame API - Documentación',
    // Mantiene el token cargado aunque se recargue la página
    swaggerOptions: { persistAuthorization: true },
  });
}
