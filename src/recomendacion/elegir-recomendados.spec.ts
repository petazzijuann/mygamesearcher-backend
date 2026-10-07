import { Juego } from '../juego/juego.entity';
import {
  calcularPuntaje,
  elegirRecomendados,
  MAXIMO_RECOMENDACIONES,
} from './elegir-recomendados';

// Ids de géneros y características usados en los juegos de prueba
const RPG = 1;
const ACCION = 2;
const PUZZLE = 3;
const MUNDO_ABIERTO = 10;
const MULTIJUGADOR = 11;

// Arma un juego de prueba con solo los datos que usa el algoritmo
function juego(
  titulo: string,
  anioLanzamiento: number,
  generoIds: number[],
  caracteristicaIds: number[] = [],
): Juego {
  return {
    titulo,
    anioLanzamiento,
    generos: generoIds.map((id) => ({ id })),
    caracteristicas: caracteristicaIds.map((id) => ({ id })),
  } as Juego;
}

describe('Algoritmo de recomendación (elegirRecomendados)', () => {
  // Mismo escenario que la prueba manual del Paso 10 (búsqueda: RPG + Acción, Mundo abierto)
  const alfa = juego('Alfa', 2020, [RPG, ACCION], [MUNDO_ABIERTO]); // 2+2+1 = 5
  const beta = juego('Beta', 2022, [RPG], [MUNDO_ABIERTO, MULTIJUGADOR]); // 2+1 = 3
  const gamma = juego('Gamma', 2021, [RPG], [MUNDO_ABIERTO]); // 2+1 = 3
  const delta = juego('Delta', 2023, [ACCION]); // 2
  const generosElegidos = [RPG, ACCION];
  const caracteristicasElegidas = [MUNDO_ABIERTO];

  it('calcula 2 puntos por género y 1 por característica en común', () => {
    expect(
      calcularPuntaje(alfa, generosElegidos, caracteristicasElegidas),
    ).toBe(5);
    expect(
      calcularPuntaje(beta, generosElegidos, caracteristicasElegidas),
    ).toBe(3);
    expect(
      calcularPuntaje(delta, generosElegidos, caracteristicasElegidas),
    ).toBe(2);
    expect(
      calcularPuntaje(juego('Zeta', 2024, [PUZZLE]), generosElegidos, []),
    ).toBe(0);
  });

  it('ordena por puntaje y devuelve como máximo 3 juegos', () => {
    const elegidos = elegirRecomendados(
      [delta, gamma, alfa, beta],
      generosElegidos,
      caracteristicasElegidas,
    );
    expect(elegidos).toHaveLength(MAXIMO_RECOMENDACIONES);
    expect(elegidos.map((j) => j.titulo)).toEqual(['Alfa', 'Beta', 'Gamma']);
  });

  it('desempata por año de lanzamiento (el más nuevo primero) y después por título', () => {
    const viejo = juego('Aaa', 2019, [RPG]);
    const nuevoB = juego('Bbb', 2024, [RPG]);
    const nuevoA = juego('Aab', 2024, [RPG]);
    const elegidos = elegirRecomendados([viejo, nuevoB, nuevoA], [RPG], []);
    expect(elegidos.map((j) => j.titulo)).toEqual(['Aab', 'Bbb', 'Aaa']);
  });

  it('devuelve menos de 3 si hay pocos candidatos, y ninguno si no hay', () => {
    expect(elegirRecomendados([delta], generosElegidos, [])).toEqual([delta]);
    expect(elegirRecomendados([], generosElegidos, [])).toEqual([]);
  });
});
