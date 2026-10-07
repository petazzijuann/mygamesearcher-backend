import { PartialType } from '@nestjs/swagger';
import { CrearJuegoDto } from './crear-juego.dto';

export class ActualizarJuegoDto extends PartialType(CrearJuegoDto) {}
