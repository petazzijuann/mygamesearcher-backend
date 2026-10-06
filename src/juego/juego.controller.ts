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
import { ActualizarJuegoDto } from './dto/actualizar-juego.dto';
import { CrearJuegoDto } from './dto/crear-juego.dto';
import { JuegoService } from './juego.service';

@Controller('juegos')
export class JuegoController {
  constructor(private readonly juegoService: JuegoService) {}

  @Post()
  crear(@Body() dto: CrearJuegoDto) {
    return this.juegoService.crear(dto);
  }

  @Get()
  listar() {
    return this.juegoService.listar();
  }

  @Get(':id')
  buscarPorId(@Param('id', idPipe) id: number) {
    return this.juegoService.buscarPorId(id);
  }

  @Patch(':id')
  actualizar(@Param('id', idPipe) id: number, @Body() dto: ActualizarJuegoDto) {
    return this.juegoService.actualizar(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  eliminar(@Param('id', idPipe) id: number) {
    return this.juegoService.eliminar(id);
  }
}
