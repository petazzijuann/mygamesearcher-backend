import { Juego } from '../juego/juego.entity';

// Cantidad máxima de juegos recomendados por búsqueda
export const MAXIMO_RECOMENDACIONES = 3;

// Peso de cada coincidencia en el puntaje: el género es el criterio principal
export const PUNTOS_POR_GENERO = 2;
export const PUNTOS_POR_CARACTERISTICA = 1;

// Puntaje de un juego según los criterios elegidos
export function calcularPuntaje(
  juego: Juego,
  generoIds: number[],
  caracteristicaIds: number[],
): number {
  const generosEnComun = juego.generos.filter((genero) =>
    generoIds.includes(genero.id),
  ).length;
  const caracteristicasEnComun = juego.caracteristicas.filter(
    (caracteristica) => caracteristicaIds.includes(caracteristica.id),
  ).length;
  return (
    generosEnComun * PUNTOS_POR_GENERO +
    caracteristicasEnComun * PUNTOS_POR_CARACTERISTICA
  );
}

// Ordena los candidatos por puntaje (mayor primero); si empatan, el más nuevo y después
// por título. Devuelve como máximo MAXIMO_RECOMENDACIONES juegos, en el orden final.
// Es una función pura (sin base de datos) para poder probarla con tests unitarios
export function elegirRecomendados(
  candidatos: Juego[],
  generoIds: number[],
  caracteristicaIds: number[],
): Juego[] {
  return candidatos
    .map((juego) => ({
      juego,
      puntaje: calcularPuntaje(juego, generoIds, caracteristicaIds),
    }))
    .sort(
      (a, b) =>
        b.puntaje - a.puntaje ||
        b.juego.anioLanzamiento - a.juego.anioLanzamiento ||
        a.juego.titulo.localeCompare(b.juego.titulo, 'es'),
    )
    .slice(0, MAXIMO_RECOMENDACIONES)
    .map(({ juego }) => juego);
}
