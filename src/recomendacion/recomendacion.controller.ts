import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { idPipe } from '../comun/id.pipe';
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
}
