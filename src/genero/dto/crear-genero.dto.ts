import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CrearGeneroDto {
  // Saca los espacios de los extremos antes de validar
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  // class-validator ejecuta los decoradores de abajo hacia arriba:
  // primero obligatorio, despues texto, despues largo maximo
  @MaxLength(50, { message: 'El nombre no puede superar los 50 caracteres' })
  @IsString({ message: 'El nombre debe ser un texto' })
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  nombre: string;
}
