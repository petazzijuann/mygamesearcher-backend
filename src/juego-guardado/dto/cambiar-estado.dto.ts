import { IsDefined, IsEnum } from 'class-validator';
import { EstadoJuego } from '../estado-juego.enum';

// Body de PATCH /biblioteca/:juegoId: el juego viene en la URL y el usuario sale del token.
// class-validator ejecuta los decoradores de abajo hacia arriba
export class CambiarEstadoDto {
  @IsEnum(EstadoJuego, {
    message: 'El estado debe ser ME_INTERESA o YA_JUGADO',
  })
  @IsDefined({ message: 'El estado es obligatorio' })
  estado: EstadoJuego;
}
