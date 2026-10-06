import { Transform } from 'class-transformer';
import { IsOptional, IsString, MaxLength } from 'class-validator';

// Filtros del listado (query string): GET /juegos?titulo=elden
export class FiltroJuegosDto {
  // Saca los espacios de los extremos antes de validar
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @MaxLength(100, {
    message: 'El título a buscar no puede superar los 100 caracteres',
  })
  @IsString({ message: 'El título a buscar debe ser un texto' })
  @IsOptional()
  titulo?: string;
}
