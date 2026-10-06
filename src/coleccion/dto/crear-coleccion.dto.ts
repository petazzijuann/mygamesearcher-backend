import { Transform } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsDefined,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

// Saca los espacios de los extremos antes de validar
const recortar = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

// class-validator ejecuta los decoradores de abajo hacia arriba,
// por eso en cada campo la validación más básica va última
export class CrearColeccionDto {
  // Temporal: cuando haya login, el usuario sale del token
  @IsInt({ message: 'El usuario debe ser un id entero' })
  @IsDefined({ message: 'El usuario es obligatorio' })
  usuarioId: number;

  @Transform(recortar)
  @MaxLength(100, { message: 'El nombre no puede superar los 100 caracteres' })
  @IsString({ message: 'El nombre debe ser un texto' })
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  nombre: string;

  @Transform(recortar)
  @MaxLength(500, {
    message: 'La descripción no puede superar los 500 caracteres',
  })
  @IsString({ message: 'La descripción debe ser un texto' })
  @IsOptional()
  descripcion?: string | null;

  @IsInt({ each: true, message: 'Cada id de juego debe ser un número entero' })
  @ArrayUnique({ message: 'Los juegos no pueden repetirse' })
  @IsArray({ message: 'Los juegos deben ser una lista de ids' })
  @IsOptional()
  juegoIds?: number[] | null;
}
