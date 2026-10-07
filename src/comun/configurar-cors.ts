import { INestApplication } from '@nestjs/common';

// Puerto por defecto de Vite: el frontend en desarrollo
export const FRONTEND_POR_DEFECTO = 'http://localhost:5173';

// Convierte FRONTEND_URL en la lista de orígenes permitidos.
// Acepta varias direcciones separadas por coma (por ejemplo, el frontend local y el publicado).
// Saca espacios y la "/" final, porque el navegador manda el origen sin barra al final
export function obtenerOrigenesPermitidos(valor?: string): string[] {
  const origenes = (valor ?? '')
    .split(',')
    .map((origen) => origen.trim().replace(/\/+$/, ''))
    .filter((origen) => origen.length > 0);
  return origenes.length > 0 ? origenes : [FRONTEND_POR_DEFECTO];
}

// Habilita CORS solo para los orígenes del frontend, así el navegador deja que
// el frontend (publicado en otra dirección) lea las respuestas de la API.
// Los métodos permitidos por defecto incluyen GET, POST, PATCH y DELETE, y el
// header Authorization (token) pasa sin configuración extra
export function configurarCors(
  app: INestApplication,
  origenes: string[],
): void {
  app.enableCors({ origin: origenes });
}
