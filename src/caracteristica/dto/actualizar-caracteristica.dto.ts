import { PartialType } from '@nestjs/swagger';
import { CrearCaracteristicaDto } from './crear-caracteristica.dto';

export class ActualizarCaracteristicaDto extends PartialType(
  CrearCaracteristicaDto,
) {}
