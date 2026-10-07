import { Transform } from 'class-transformer';
import {
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsDefined,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

const ANIO_MINIMO = 1950;
const ANIO_ACTUAL = new Date().getFullYear();

// Saca los espacios de los extremos antes de validar
const recortar = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

// class-validator ejecuta los decoradores de abajo hacia arriba,
// por eso en cada campo la validación más básica va última
export class CrearJuegoDto {
  @Transform(recortar)
  @MaxLength(100, { message: 'El título no puede superar los 100 caracteres' })
  @IsString({ message: 'El título debe ser un texto' })
  @IsNotEmpty({ message: 'El título es obligatorio' })
  titulo: string;

  @Max(ANIO_ACTUAL, {
    message: `El año de lanzamiento debe estar entre ${ANIO_MINIMO} y ${ANIO_ACTUAL}`,
  })
  @Min(ANIO_MINIMO, {
    message: `El año de lanzamiento debe estar entre ${ANIO_MINIMO} y ${ANIO_ACTUAL}`,
  })
  @IsInt({ message: 'El año de lanzamiento debe ser un número entero' })
  @IsDefined({ message: 'El año de lanzamiento es obligatorio' })
  anioLanzamiento: number;

  @Transform(recortar)
  @MaxLength(2000, {
    message: 'La descripción no puede superar los 2000 caracteres',
  })
  @IsString({ message: 'La descripción debe ser un texto' })
  @IsNotEmpty({ message: 'La descripción es obligatoria' })
  descripcion: string;

  @MaxLength(500, {
    message: 'La URL de la imagen no puede superar los 500 caracteres',
  })
  @IsUrl(
    { protocols: ['http', 'https'], require_protocol: true },
    { message: 'La URL de la imagen no es válida' },
  )
  @IsOptional()
  imagenUrl?: string | null;

  @IsInt({ message: 'La clasificación de edad debe ser un id entero' })
  @IsDefined({ message: 'La clasificación de edad es obligatoria' })
  clasificacionEdadId: number;

  @IsInt({
    each: true,
    message: 'Cada id de plataforma debe ser un número entero',
  })
  @ArrayUnique({ message: 'Las plataformas no pueden repetirse' })
  @ArrayNotEmpty({ message: 'Debe indicar al menos una plataforma' })
  @IsArray({ message: 'Las plataformas deben ser una lista de ids' })
  @IsDefined({ message: 'Las plataformas son obligatorias' })
  plataformaIds: number[];

  @IsInt({ each: true, message: 'Cada id de género debe ser un número entero' })
  @ArrayUnique({ message: 'Los géneros no pueden repetirse' })
  @ArrayNotEmpty({ message: 'Debe indicar al menos un género' })
  @IsArray({ message: 'Los géneros deben ser una lista de ids' })
  @IsDefined({ message: 'Los géneros son obligatorios' })
  generoIds: number[];

  @IsInt({
    each: true,
    message: 'Cada id de característica debe ser un número entero',
  })
  @ArrayUnique({ message: 'Las características no pueden repetirse' })
  @IsArray({ message: 'Las características deben ser una lista de ids' })
  @IsOptional()
  caracteristicaIds?: number[];
}
