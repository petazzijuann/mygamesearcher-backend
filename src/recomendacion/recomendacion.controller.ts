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
import { UsuarioActual } from '../auth/decoradores/usuario-actual.decorator';
import type { UsuarioToken } from '../auth/usuario-token.interface';
import { idPipe } from '../comun/id.pipe';
import { CalificarRecomendacionDto } from './dto/calificar-recomendacion.dto';
import { FiltroHistorialDto } from './dto/filtro-historial.dto';
import { GenerarRecomendacionDto } from './dto/generar-recomendacion.dto';
import { RecomendacionService } from './recomendacion.service';

// Todas las rutas piden sesión; el usuario sale del token
@Controller('recomendaciones')
export class RecomendacionController {
  constructor(private readonly recomendacionService: RecomendacionService) {}

  // CUU Generar recomendación personalizada
  @Post()
  generar(
    @Body() dto: GenerarRecomendacionDto,
    @UsuarioActual() usuarioActual: UsuarioToken,
  ) {
    return this.recomendacionService.generar(dto, usuarioActual);
  }

  // Historial del usuario, filtrado por fecha (desde / hasta)
  @Get()
  listar(
    @Query() filtro: FiltroHistorialDto,
    @UsuarioActual() usuarioActual: UsuarioToken,
  ) {
    return this.recomendacionService.listar(filtro, usuarioActual);
  }

  // Detalle de una búsqueda con sus recomendaciones
  @Get(':id')
  consultar(
    @Param('id', idPipe) id: number,
    @UsuarioActual() usuarioActual: UsuarioToken,
  ) {
    return this.recomendacionService.consultar(id, usuarioActual);
  }

  // CUU Consultar historial: calificar un juego recomendado
  @Patch(':busquedaId/juegos/:juegoId')
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
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  eliminar(
    @Param('id', idPipe) id: number,
    @UsuarioActual() usuarioActual: UsuarioToken,
  ) {
    return this.recomendacionService.eliminar(id, usuarioActual);
  }
}
