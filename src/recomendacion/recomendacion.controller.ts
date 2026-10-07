import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiErrores } from '../comun/documentacion';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UsuarioActual } from '../auth/decoradores/usuario-actual.decorator';
import type { UsuarioToken } from '../auth/usuario-token.interface';
import { idPipe } from '../comun/id.pipe';
import { CalificarRecomendacionDto } from './dto/calificar-recomendacion.dto';
import { FiltroHistorialDto } from './dto/filtro-historial.dto';
import { GenerarRecomendacionDto } from './dto/generar-recomendacion.dto';
import { RecomendacionService } from './recomendacion.service';

// Todas las rutas piden sesión; el usuario sale del token
@ApiTags('Recomendaciones')
@ApiBearerAuth()
@Controller('recomendaciones')
export class RecomendacionController {
  constructor(private readonly recomendacionService: RecomendacionService) {}

  // CUU Generar recomendación personalizada
  @ApiOperation({
    summary:
      'CUU Generar recomendación: de 1 a 3 juegos según los criterios, sin los YA_JUGADO (usuario con sesión)',
  })
  @Post()
  @ApiErrores(400, 401, 404)
  generar(
    @Body() dto: GenerarRecomendacionDto,
    @UsuarioActual() usuarioActual: UsuarioToken,
  ) {
    return this.recomendacionService.generar(dto, usuarioActual);
  }

  // Historial del usuario, filtrado por fecha (desde / hasta)
  @ApiOperation({
    summary:
      'Ver mi historial de recomendaciones, con filtro opcional por fechas (usuario con sesión)',
  })
  @Get()
  @ApiErrores(400, 401)
  listar(
    @Query() filtro: FiltroHistorialDto,
    @UsuarioActual() usuarioActual: UsuarioToken,
  ) {
    return this.recomendacionService.listar(filtro, usuarioActual);
  }

  // Detalle de una búsqueda con sus recomendaciones
  @ApiOperation({
    summary:
      'Ver el detalle de una búsqueda con sus recomendaciones (el dueño o un ADMIN)',
  })
  @Get(':id')
  @ApiErrores(400, 401, 403, 404)
  consultar(
    @Param('id', idPipe) id: number,
    @UsuarioActual() usuarioActual: UsuarioToken,
  ) {
    return this.recomendacionService.consultar(id, usuarioActual);
  }

  // CUU Consultar historial: calificar un juego recomendado
  @ApiOperation({
    summary:
      'Calificar de 1 a 5 un juego recomendado, con comentario opcional (el dueño o un ADMIN)',
  })
  @Patch(':busquedaId/juegos/:juegoId')
  @ApiErrores(400, 401, 403, 404)
  calificar(
    @Param('busquedaId', idPipe) busquedaId: number,
    @Param('juegoId', idPipe) juegoId: number,
    @Body() dto: CalificarRecomendacionDto,
    @UsuarioActual() usuarioActual: UsuarioToken,
  ) {
    return this.recomendacionService.calificar(
      busquedaId,
      juegoId,
      dto,
      usuarioActual,
    );
  }

  // CUU Consultar historial: borrar una búsqueda del historial
  @ApiOperation({
    summary: 'Borrar una búsqueda del historial (el dueño o un ADMIN)',
  })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiErrores(400, 401, 403, 404)
  eliminar(
    @Param('id', idPipe) id: number,
    @UsuarioActual() usuarioActual: UsuarioToken,
  ) {
    return this.recomendacionService.eliminar(id, usuarioActual);
  }
}
