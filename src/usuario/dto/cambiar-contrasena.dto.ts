import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

// Body de PATCH /usuarios/:id/contrasena. Sin trim: los espacios pueden ser parte de la contraseña.
// Que la nueva sea distinta de la actual se controla en el service (compara dos campos).
// class-validator ejecuta los decoradores de abajo hacia arriba
export class CambiarContrasenaDto {
  @IsString({ message: 'La contraseña actual debe ser un texto' })
  @IsNotEmpty({ message: 'La contraseña actual es obligatoria' })
  contrasenaActual: string;

  // Mismas reglas que en el registro (bcrypt ignora lo que pase de 72 bytes)
  @MaxLength(72, {
    message: 'La contraseña nueva no puede superar los 72 caracteres',
  })
  @MinLength(8, {
    message: 'La contraseña nueva debe tener al menos 8 caracteres',
  })
  @IsString({ message: 'La contraseña nueva debe ser un texto' })
  @IsNotEmpty({ message: 'La contraseña nueva es obligatoria' })
  contrasenaNueva: string;
}
