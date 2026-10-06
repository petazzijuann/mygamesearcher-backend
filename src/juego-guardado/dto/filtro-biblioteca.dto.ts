import { IsEnum, IsOptional } from 'class-validator';
import { EstadoJuego } from '../estado-juego.enum';
import { UsuarioQueryDto } from './usuario-query.dto';

// Filtros del listado: GET /biblioteca?usuarioId=1&estado=YA_JUGADO
export class FiltroBibliotecaDto extends UsuarioQueryDto {
  @IsEnum(EstadoJuego, {
    message: 'El estado debe ser ME_INTERESA o YA_JUGADO',
  })
  @IsOptional()
  estado?: EstadoJuego;
}
