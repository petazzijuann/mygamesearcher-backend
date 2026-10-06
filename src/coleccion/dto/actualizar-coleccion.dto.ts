import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CrearColeccionDto } from './crear-coleccion.dto';

// Sin usuarioId: una colección no puede cambiar de dueño
export class ActualizarColeccionDto extends PartialType(
  OmitType(CrearColeccionDto, ['usuarioId'] as const),
) {}
