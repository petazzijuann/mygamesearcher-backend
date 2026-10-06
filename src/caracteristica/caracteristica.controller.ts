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
} from '@nestjs/common';
import { idPipe } from '../comun/id.pipe';
import { CaracteristicaService } from './caracteristica.service';
import { ActualizarCaracteristicaDto } from './dto/actualizar-caracteristica.dto';
import { CrearCaracteristicaDto } from './dto/crear-caracteristica.dto';

@Controller('caracteristicas')
export class CaracteristicaController {
  constructor(private readonly caracteristicaService: CaracteristicaService) {}

  @Post()
  crear(@Body() dto: CrearCaracteristicaDto) {
    return this.caracteristicaService.crear(dto);
  }

  @Get()
  listar() {
    return this.caracteristicaService.listar();
  }

  @Get(':id')
  buscarPorId(@Param('id', idPipe) id: number) {
    return this.caracteristicaService.buscarPorId(id);
  }

  @Patch(':id')
  actualizar(
    @Param('id', idPipe) id: number,
    @Body() dto: ActualizarCaracteristicaDto,
  ) {
    return this.caracteristicaService.actualizar(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  eliminar(@Param('id', idPipe) id: number) {
    return this.caracteristicaService.eliminar(id);
  }
}
