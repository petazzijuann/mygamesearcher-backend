import { NestFactory } from '@nestjs/core';
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { AppModule } from './app.module';
import { crearDocumento } from './comun/configurar-swagger';

// Exporta la documentación de la API a docs/openapi.json.
// Se corre con: npm run docs:openapi
//
// preview: true registra los módulos y las rutas pero no crea los providers,
// así que no se conecta a la base ni crea el administrador: se puede correr sin .env ni Supabase
async function generar() {
  const app = await NestFactory.create(AppModule, {
    preview: true,
    logger: ['error', 'warn'],
  });
  const documento = crearDocumento(app);

  const carpeta = join(process.cwd(), 'docs');
  mkdirSync(carpeta, { recursive: true });
  const archivo = join(carpeta, 'openapi.json');
  writeFileSync(archivo, JSON.stringify(documento, null, 2) + '\n', 'utf8');

  const rutas = Object.values(documento.paths).reduce(
    (total, metodos) => total + Object.keys(metodos).length,
    0,
  );
  // console.log y no Logger: el logger de Nest quedó limitado a errores y advertencias
  console.log(`Documentación exportada en docs/openapi.json (${rutas} rutas)`);
  await app.close();
}
void generar();
