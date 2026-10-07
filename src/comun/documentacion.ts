import { applyDecorators } from '@nestjs/common';
import { ApiProperty, ApiResponse } from '@nestjs/swagger';

// Forma de todas las respuestas de error de la API (la arma NestJS; los mensajes están en español)
export class ErrorRespuestaDto {
  @ApiProperty({ example: 404 })
  statusCode: number;

  @ApiProperty({
    description:
      'Mensaje en español. En los errores de validación (400) es una lista con un mensaje por campo',
    oneOf: [
      { type: 'string', example: 'No se encontró el género con id 9999' },
      {
        type: 'array',
        items: { type: 'string' },
        example: ['El nombre es obligatorio'],
      },
    ],
  })
  message: string | string[];

  @ApiProperty({ example: 'Not Found' })
  error: string;
}

export type CodigoError = 400 | 401 | 403 | 404 | 409;

const DESCRIPCIONES: Record<CodigoError, string> = {
  400: 'Datos inválidos: el mensaje indica qué campo falló, un id de la URL que no es un número, o un id del body que no existe',
  401: 'Sin sesión: falta el token, es inválido o está vencido',
  403: 'Sin permiso: la acción es solo para ADMIN o el recurso es de otro usuario',
  404: 'No existe el recurso pedido',
  409: 'Conflicto: el dato ya existe (duplicado) o está en uso y no se puede borrar',
};

// Documenta las respuestas de error que puede devolver una ruta, todas con el esquema ErrorRespuestaDto.
// Uso: @ApiErrores(400, 404, 409)
export function ApiErrores(...codigos: CodigoError[]) {
  return applyDecorators(
    ...codigos.map((codigo) =>
      ApiResponse({
        status: codigo,
        description: DESCRIPCIONES[codigo],
        type: ErrorRespuestaDto,
      }),
    ),
  );
}
