import {
  FRONTEND_POR_DEFECTO,
  obtenerOrigenesPermitidos,
} from './configurar-cors';

describe('obtenerOrigenesPermitidos (CORS)', () => {
  it('sin FRONTEND_URL usa el frontend local de Vite', () => {
    expect(obtenerOrigenesPermitidos(undefined)).toEqual([
      FRONTEND_POR_DEFECTO,
    ]);
    expect(obtenerOrigenesPermitidos('  ')).toEqual([FRONTEND_POR_DEFECTO]);
  });

  it('acepta varias direcciones separadas por coma, sin espacios ni barra final', () => {
    expect(
      obtenerOrigenesPermitidos(
        ' http://localhost:5173 , https://dgame.vercel.app/ ,',
      ),
    ).toEqual(['http://localhost:5173', 'https://dgame.vercel.app']);
  });
});
