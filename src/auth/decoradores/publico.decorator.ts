import { SetMetadata } from '@nestjs/common';

export const ES_PUBLICO = 'esPublico';

// Marca una ruta (o un controller entero) que no pide token
export const Publico = () => SetMetadata(ES_PUBLICO, true);
