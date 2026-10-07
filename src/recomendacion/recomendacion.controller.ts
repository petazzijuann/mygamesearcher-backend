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
import { idPipe } from '../comun/id.pipe';
import { CalificarRecomendacionDto } from './dto/calificar-recomendacion.dto';
import { FiltroHistorialDto } from './dto/filtro-historial.dto';
import { GenerarRecomendacionDto } from './dto/generar-recomendacion.dto';
import { RecomendacionService } from './recomendacion.service';

@Controller('recomendaciones')
export class RecomendacionController {
  constructor(private readonly recomendacionService: RecomendacionService) {}

  // CUU Generar recomendación personalizada
  @Post()
  generar(@Body() dto: GenerarRecomendacionDto) {
    return this.recomendacionService.generar(dto);
  }

  // Historial del usuario, filtrado por fecha (desde / hasta)
  @Get()
  listar(@Query() filtro: FiltroHistorialDto) {
    return this.recomendacionService.listar(filtro);
  }

  // Detalle de una búsqueda con sus recomendaciones
  @Get(':id')
  buscarPorId(@Param('id', idPipe) id: number) {
    return this.recomendacionService.buscarPorId(id);
  }

  // CUU Consultar historial: calificar un juego recomendado
  @Patch(':busquedaId/juegos/:juegoId')
  calificar(
    @Param('busquedaId', idPipe) busquedaId: number,
    @Param('juegoId', idPipe) juegoId: number,
    @Body() dto: CalificarRecomendacionDto,
  ) {
    return this.recomendacionService.calificar(busquedaId, juegoId, dto);
  }

  // CUU Consultar historial: borrar una búsqueda del historial
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  eliminar(@Param('id', idPipe) id: number) {
    return this.recomendacionService.eliminar(id);
  }
}
