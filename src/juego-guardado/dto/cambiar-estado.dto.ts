import { PickType } from '@nestjs/mapped-types';
import { GuardarJuegoDto } from './guardar-juego.dto';

// El juego viene en la URL; en el body solo el usuario y el nuevo estado (ambos obligatorios)
export class CambiarEstadoDto extends PickType(GuardarJuegoDto, [
  'usuarioId',
  'estado',
] as const) {}
