import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configurarApp } from './comun/configurar-app';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ValidationPipe y filtro de errores globales (ver comun/configurar-app.ts)
  configurarApp(app);

  const config = app.get(ConfigService);
  const puerto = config.get<string>('PORT') ?? 3000;
  await app.listen(puerto);
  Logger.log(`API escuchando en http://localhost:${puerto}`, 'Bootstrap');
}
void bootstrap();
