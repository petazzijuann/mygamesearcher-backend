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
import { AgregarJuegoDto } from './dto/agregar-juego.dto';
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

  // CUU Administrar colección: agregar y quitar juegos de a uno
  @Post(':id/juegos')
  agregarJuego(@Param('id', idPipe) id: number, @Body() dto: AgregarJuegoDto) {
    return this.coleccionService.agregarJuego(id, dto.juegoId);
  }

  @Delete(':id/juegos/:juegoId')
  @HttpCode(HttpStatus.NO_CONTENT)
  quitarJuego(
    @Param('id', idPipe) id: number,
    @Param('juegoId', idPipe) juegoId: number,
  ) {
    return this.coleccionService.quitarJuego(id, juegoId);
  }
}
