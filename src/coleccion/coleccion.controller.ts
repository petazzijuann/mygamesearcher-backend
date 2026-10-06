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
import { ColeccionService } from './coleccion.service';
import { ActualizarColeccionDto } from './dto/actualizar-coleccion.dto';
import { CrearColeccionDto } from './dto/crear-coleccion.dto';
import { FiltroColeccionesDto } from './dto/filtro-colecciones.dto';

@Controller('colecciones')
export class ColeccionController {
  constructor(private readonly coleccionService: ColeccionService) {}

  @Post()
  crear(@Body() dto: CrearColeccionDto) {
    return this.coleccionService.crear(dto);
  }

  @Get()
  listar(@Query() filtro: FiltroColeccionesDto) {
    return this.coleccionService.listar(filtro.usuarioId);
  }

  @Get(':id')
  buscarPorId(@Param('id', idPipe) id: number) {
    return this.coleccionService.buscarPorId(id);
  }

  @Patch(':id')
  actualizar(
    @Param('id', idPipe) id: number,
    @Body() dto: ActualizarColeccionDto,
  ) {
    return this.coleccionService.actualizar(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  eliminar(@Param('id', idPipe) id: number) {
    return this.coleccionService.eliminar(id);
  }
}
