import { Juego } from '../juego.entity';

// Respuesta de GET /juegos: una página de juegos y los datos para armar el paginador
export class JuegosPaginadosDto {
  /** Juegos de la página pedida, ordenados por título */
  datos: Juego[];

  /** Cantidad total de juegos que cumplen el filtro (en todas las páginas) */
  total: number;

  /** Página devuelta, empieza en 1 */
  pagina: number;

  /** Cantidad máxima de juegos por página */
  limite: number;

  /** Cantidad de páginas; 0 si no hay juegos */
  totalPaginas: number;
}
