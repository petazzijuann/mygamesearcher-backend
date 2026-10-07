import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

// Saca los espacios de los extremos antes de validar
const recortar = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

// class-validator ejecuta los decoradores de abajo hacia arriba,
// por eso en cada campo la validación más básica va última
export class CrearUsuarioDto {
  @Transform(recortar)
  @MaxLength(50, { message: 'El nombre no puede superar los 50 caracteres' })
  @IsString({ message: 'El nombre debe ser un texto' })
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  nombre: string;

  @Transform(recortar)
  @MaxLength(50, { message: 'El apellido no puede superar los 50 caracteres' })
  @IsString({ message: 'El apellido debe ser un texto' })
  @IsNotEmpty({ message: 'El apellido es obligatorio' })
  apellido: string;

  // Se guarda en minúsculas para que "Juan@Mail.com" y "juan@mail.com" sean el mismo
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @MaxLength(100, { message: 'El email no puede superar los 100 caracteres' })
  @IsEmail({}, { message: 'El email no es válido' })
  @IsNotEmpty({ message: 'El email es obligatorio' })
  email: string;

  // Sin trim: los espacios pueden ser parte de la contraseña.
  // Máximo 72 porque bcrypt ignora lo que pase de 72 bytes.
  @MaxLength(72, {
    message: 'La contraseña no puede superar los 72 caracteres',
  })
  @MinLength(8, {
    message: 'La contraseña debe tener al menos 8 caracteres',
  })
  @IsString({ message: 'La contraseña debe ser un texto' })
  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  contrasena: string;

  @IsInt({ message: 'La plataforma debe ser un id entero' })
  @IsOptional()
  plataformaId?: number;
}
