import {
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsDefined,
  IsInt,
  IsOptional,
} from 'class-validator';

// Criterios de búsqueda para generar una recomendación.
// class-validator ejecuta los decoradores de abajo hacia arriba,
// por eso en cada campo la validación más básica va última
export class GenerarRecomendacionDto {
  // Temporal: cuando haya login, el usuario sale del token
  @IsInt({ message: 'El usuario debe ser un id entero' })
  @IsDefined({ message: 'El usuario es obligatorio' })
  usuarioId: number;

  @IsInt({
    each: true,
    message: 'Cada id de plataforma debe ser un número entero',
  })
  @ArrayUnique({ message: 'Las plataformas no pueden repetirse' })
  @ArrayNotEmpty({ message: 'Debe elegir al menos una plataforma' })
  @IsArray({ message: 'Las plataformas deben ser una lista de ids' })
  @IsDefined({ message: 'Debe elegir al menos una plataforma' })
  plataformaIds: number[];

  @IsInt({ each: true, message: 'Cada id de género debe ser un número entero' })
  @ArrayUnique({ message: 'Los géneros no pueden repetirse' })
  @ArrayNotEmpty({ message: 'Debe elegir al menos un género' })
  @IsArray({ message: 'Los géneros deben ser una lista de ids' })
  @IsDefined({ message: 'Debe elegir al menos un género' })
  generoIds: number[];

  @IsInt({
    each: true,
    message: 'Cada id de característica debe ser un número entero',
  })
  @ArrayUnique({ message: 'Las características no pueden repetirse' })
  @IsArray({ message: 'Las características deben ser una lista de ids' })
  @IsOptional()
  caracteristicaIds?: number[] | null;
}
