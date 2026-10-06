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
import { ClasificacionEdadService } from './clasificacion-edad.service';
import { ActualizarClasificacionEdadDto } from './dto/actualizar-clasificacion-edad.dto';
import { CrearClasificacionEdadDto } from './dto/crear-clasificacion-edad.dto';

@Controller('clasificaciones-edad')
export class ClasificacionEdadController {
  constructor(
    private readonly clasificacionEdadService: ClasificacionEdadService,
  ) {}

  @Post()
  crear(@Body() dto: CrearClasificacionEdadDto) {
    return this.clasificacionEdadService.crear(dto);
  }

  @Get()
  listar() {
    return this.clasificacionEdadService.listar();
  }

  @Get(':id')
  buscarPorId(@Param('id', idPipe) id: number) {
    return this.clasificacionEdadService.buscarPorId(id);
  }

  @Patch(':id')
  actualizar(
    @Param('id', idPipe) id: number,
    @Body() dto: ActualizarClasificacionEdadDto,
  ) {
    return this.clasificacionEdadService.actualizar(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  eliminar(@Param('id', idPipe) id: number) {
    return this.clasificacionEdadService.eliminar(id);
  }
}
