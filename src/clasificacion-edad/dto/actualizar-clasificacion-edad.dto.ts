import { PartialType } from '@nestjs/mapped-types';
import { CrearClasificacionEdadDto } from './crear-clasificacion-edad.dto';

export class ActualizarClasificacionEdadDto extends PartialType(
  CrearClasificacionEdadDto,
) {}
