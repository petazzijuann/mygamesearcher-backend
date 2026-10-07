import { BadRequestException, ParseIntPipe } from '@nestjs/common';

// ParseIntPipe con el mensaje de error en español, para los :id de todas las rutas
export const idPipe = new ParseIntPipe({
  exceptionFactory: () =>
    new BadRequestException('El id debe ser un número entero'),
});
