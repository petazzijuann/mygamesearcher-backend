import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configurarApp } from './comun/configurar-app';
import {
  configurarSwagger,
  RUTA_DOCUMENTACION,
} from './comun/configurar-swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ValidationPipe y filtro de errores globales (ver comun/configurar-app.ts)
  configurarApp(app);
  // Documentación interactiva de la API (ver comun/configurar-swagger.ts)
  configurarSwagger(app);

  const config = app.get(ConfigService);
  const puerto = config.get<string>('PORT') ?? 3000;
  await app.listen(puerto);
  Logger.log(`API escuchando en http://localhost:${puerto}`, 'Bootstrap');
  Logger.log(
    `Documentación en http://localhost:${puerto}/${RUTA_DOCUMENTACION}`,
    'Bootstrap',
  );
}
void bootstrap();
