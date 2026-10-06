import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { FiltroErroresBd } from './comun/filtro-errores-bd.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

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

  const config = app.get(ConfigService);
  const puerto = config.get<string>('PORT') ?? 3000;
  await app.listen(puerto);
  Logger.log(`API escuchando en http://localhost:${puerto}`, 'Bootstrap');
}
void bootstrap();
