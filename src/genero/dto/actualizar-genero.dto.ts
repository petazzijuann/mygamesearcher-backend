import { PartialType } from '@nestjs/mapped-types';
import { CrearGeneroDto } from './crear-genero.dto';

export class ActualizarGeneroDto extends PartialType(CrearGeneroDto) {}
