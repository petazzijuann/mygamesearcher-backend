import { IsDefined, IsEnum, IsInt } from 'class-validator';
import { EstadoJuego } from '../estado-juego.enum';

// class-validator ejecuta los decoradores de abajo hacia arriba,
// por eso en cada campo la validación más básica va última
export class GuardarJuegoDto {
  // Temporal: cuando haya login, el usuario sale del token
  @IsInt({ message: 'El usuario debe ser un id entero' })
  @IsDefined({ message: 'El usuario es obligatorio' })
  usuarioId: number;

  @IsInt({ message: 'El juego debe ser un id entero' })
  @IsDefined({ message: 'El juego es obligatorio' })
  juegoId: number;

  @IsEnum(EstadoJuego, {
    message: 'El estado debe ser ME_INTERESA o YA_JUGADO',
  })
  @IsDefined({ message: 'El estado es obligatorio' })
  estado: EstadoJuego;
}
