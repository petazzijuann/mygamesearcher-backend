import { IsEnum, IsOptional } from 'class-validator';
import { EstadoJuego } from '../estado-juego.enum';

// Filtro del listado: GET /biblioteca?estado=YA_JUGADO (el usuario sale del token)
export class FiltroBibliotecaDto {
  @IsEnum(EstadoJuego, {
    message: 'El estado debe ser ME_INTERESA o YA_JUGADO',
  })
  @IsOptional()
  estado?: EstadoJuego;
}
