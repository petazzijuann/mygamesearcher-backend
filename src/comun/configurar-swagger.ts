import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

// Ruta de la documentación interactiva: http://localhost:3000/docs
// (el JSON de OpenAPI queda en /docs-json)
export const RUTA_DOCUMENTACION = 'docs';

// Arma la documentación de la API con Swagger (OpenAPI).
// Los esquemas de los DTOs los genera el plugin de @nestjs/swagger (nest-cli.json)
// a partir de los tipos y de las validaciones de class-validator
export function configurarSwagger(app: INestApplication): void {
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

  const documento = SwaggerModule.createDocument(app, configuracion);
  SwaggerModule.setup(RUTA_DOCUMENTACION, app, documento, {
    customSiteTitle: 'DGame API - Documentación',
    // Mantiene el token cargado aunque se recargue la página
    swaggerOptions: { persistAuthorization: true },
  });
}
