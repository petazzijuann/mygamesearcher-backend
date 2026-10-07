import { PartialType } from '@nestjs/swagger';
import { CrearClasificacionEdadDto } from './crear-clasificacion-edad.dto';

export class ActualizarClasificacionEdadDto extends PartialType(
  CrearClasificacionEdadDto,
) {}
