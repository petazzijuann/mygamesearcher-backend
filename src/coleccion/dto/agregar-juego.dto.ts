import { IsDefined, IsInt } from 'class-validator';

// Body de POST /colecciones/:id/juegos.
// class-validator ejecuta los decoradores de abajo hacia arriba
export class AgregarJuegoDto {
  @IsInt({ message: 'El juego debe ser un id entero' })
  @IsDefined({ message: 'El juego es obligatorio' })
  juegoId: number;
}
