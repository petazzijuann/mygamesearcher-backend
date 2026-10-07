import { Transform } from 'class-transformer';
import {
  IsDefined,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

// Body de PATCH /recomendaciones/:busquedaId/juegos/:juegoId.
// class-validator ejecuta los decoradores de abajo hacia arriba,
// por eso en cada campo la validación más básica va última
export class CalificarRecomendacionDto {
  @Max(5, { message: 'La calificación debe estar entre 1 y 5' })
  @Min(1, { message: 'La calificación debe estar entre 1 y 5' })
  @IsInt({ message: 'La calificación debe ser un número entero' })
  @IsDefined({ message: 'La calificación es obligatoria' })
  calificacion: number;

  // Saca los espacios de los extremos; un comentario vacío se guarda como null
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @MaxLength(500, {
    message: 'El comentario no puede superar los 500 caracteres',
  })
  @IsString({ message: 'El comentario debe ser un texto' })
  @IsOptional()
  comentario?: string | null;
}
