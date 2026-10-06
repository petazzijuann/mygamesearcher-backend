import { PartialType } from '@nestjs/mapped-types';
import { CrearJuegoDto } from './crear-juego.dto';

export class ActualizarJuegoDto extends PartialType(CrearJuegoDto) {}
