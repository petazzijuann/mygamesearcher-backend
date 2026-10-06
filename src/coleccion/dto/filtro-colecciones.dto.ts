import { Type } from 'class-transformer';
import { IsInt, IsOptional } from 'class-validator';

// Filtros del listado (query string): GET /colecciones?usuarioId=1
export class FiltroColeccionesDto {
  // El query string llega como texto; @Type lo convierte a número antes de validar
  @Type(() => Number)
  @IsInt({ message: 'El usuario debe ser un id entero' })
  @IsOptional()
  usuarioId?: number;
}
