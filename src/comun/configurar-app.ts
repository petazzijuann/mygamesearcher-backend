import { INestApplication, ValidationPipe } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { FiltroErroresBd } from './filtro-errores-bd.filter';

// Configuración global de la API. La usan main.ts y el test de integración,
// así el test prueba exactamente la misma validación y el mismo manejo de errores
export function configurarApp(app: INestApplication): void {
  // whitelist: descarta campos no declarados en el DTO
  // transform: convierte el body y los params a los tipos del DTO
  // stopAtFirstError: muestra un solo error por campo
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      stopAtFirstError: true,
    }),
  );

  // Convierte errores de restricciones de Postgres (clave foránea, único) en 400/409
  const { httpAdapter } = app.get(HttpAdapterHost);
  app.useGlobalFilters(new FiltroErroresBd(httpAdapter));
}
