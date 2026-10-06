import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ConflictException,
} from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { QueryFailedError } from 'typeorm';

// Códigos de error de PostgreSQL
const VIOLACION_NO_NULO = '23502';
const VIOLACION_CLAVE_FORANEA = '23503';
const VIOLACION_UNICO = '23505';

// Traduce los errores de restricciones de la base a respuestas HTTP en español.
// El resto de los errores siguen el manejo normal de NestJS.
@Catch(QueryFailedError)
export class FiltroErroresBd extends BaseExceptionFilter {
  catch(error: QueryFailedError, host: ArgumentsHost) {
    const { code, message } = error.driverError as {
      code?: string;
      message?: string;
    };

    // Pasa cuando un PATCH manda null en un campo obligatorio (PartialType no valida los null)
    if (code === VIOLACION_NO_NULO) {
      return super.catch(
        new BadRequestException('Falta un dato obligatorio'),
        host,
      );
    }

    if (code === VIOLACION_CLAVE_FORANEA) {
      // Postgres usa el mismo código al borrar algo referenciado y al insertar una referencia inexistente
      if (message?.startsWith('update or delete')) {
        return super.catch(
          new ConflictException(
            'No se puede eliminar porque hay otros datos que lo usan',
          ),
          host,
        );
      }
      return super.catch(
        new BadRequestException('Uno de los datos relacionados no existe'),
        host,
      );
    }

    if (code === VIOLACION_UNICO) {
      return super.catch(
        new ConflictException('Ya existe un registro con esos datos'),
        host,
      );
    }

    return super.catch(error, host);
  }
}
