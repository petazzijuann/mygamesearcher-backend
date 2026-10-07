import { Body, Controller, Post } from '@nestjs/common';
import { GenerarRecomendacionDto } from './dto/generar-recomendacion.dto';
import { RecomendacionService } from './recomendacion.service';

// CUU Generar recomendación personalizada
@Controller('recomendaciones')
export class RecomendacionController {
  constructor(private readonly recomendacionService: RecomendacionService) {}

  @Post()
  generar(@Body() dto: GenerarRecomendacionDto) {
    return this.recomendacionService.generar(dto);
  }
}
