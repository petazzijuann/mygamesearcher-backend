import { PartialType } from '@nestjs/mapped-types';
import { CrearColeccionDto } from './crear-coleccion.dto';

// El dueño no se puede cambiar: sale del token al crear la colección
export class ActualizarColeccionDto extends PartialType(CrearColeccionDto) {}
