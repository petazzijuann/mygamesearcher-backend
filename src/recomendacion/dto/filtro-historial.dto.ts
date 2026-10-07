import { IsISO8601, IsOptional, Matches } from 'class-validator';
import { UsuarioQueryDto } from '../../comun/usuario-query.dto';

// Solo fecha, sin hora: AAAA-MM-DD
const FORMATO_FECHA = /^\d{4}-\d{2}-\d{2}$/;

// Filtros del historial: GET /recomendaciones?usuarioId=1&desde=2026-10-01&hasta=2026-10-06
// Que desde no sea posterior a hasta se controla en el service (compara dos campos).
// class-validator ejecuta los decoradores de abajo hacia arriba
export class FiltroHistorialDto extends UsuarioQueryDto {
  // strict: además del formato, revisa que la fecha exista (rechaza 2026-02-30)
  @IsISO8601(
    { strict: true },
    { message: 'La fecha desde no es una fecha válida' },
  )
  @Matches(FORMATO_FECHA, {
    message: 'La fecha desde debe tener el formato AAAA-MM-DD',
  })
  @IsOptional()
  desde?: string;

  @IsISO8601(
    { strict: true },
    { message: 'La fecha hasta no es una fecha válida' },
  )
  @Matches(FORMATO_FECHA, {
    message: 'La fecha hasta debe tener el formato AAAA-MM-DD',
  })
  @IsOptional()
  hasta?: string;
}
