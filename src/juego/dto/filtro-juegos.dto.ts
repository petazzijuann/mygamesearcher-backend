import { Transform, Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export const LIMITE_POR_DEFECTO = 20;
export const LIMITE_MAXIMO = 100;

// Filtros y paginado del listado (query string): GET /juegos?titulo=elden&pagina=2&limite=20
// Sin pagina ni limite se devuelve la primera página con 20 juegos
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

  /** Número de página, empieza en 1 */
  @Min(1, { message: 'La página debe ser 1 o mayor' })
  @IsInt({ message: 'La página debe ser un número entero' })
  @Type(() => Number)
  @IsOptional()
  pagina?: number = 1;

  /** Cantidad de juegos por página (máximo 100) */
  @Max(LIMITE_MAXIMO, {
    message: `El límite no puede superar los ${LIMITE_MAXIMO} juegos por página`,
  })
  @Min(1, { message: 'El límite debe ser 1 o mayor' })
  @IsInt({ message: 'El límite debe ser un número entero' })
  @Type(() => Number)
  @IsOptional()
  limite?: number = LIMITE_POR_DEFECTO;
}
