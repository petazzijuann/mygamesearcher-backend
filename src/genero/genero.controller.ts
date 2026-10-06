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
import { ActualizarGeneroDto } from './dto/actualizar-genero.dto';
import { CrearGeneroDto } from './dto/crear-genero.dto';
import { GeneroService } from './genero.service';

@Controller('generos')
export class GeneroController {
  constructor(private readonly generoService: GeneroService) {}

  @Post()
  crear(@Body() dto: CrearGeneroDto) {
    return this.generoService.crear(dto);
  }

  @Get()
  listar() {
    return this.generoService.listar();
  }

  @Get(':id')
  buscarPorId(@Param('id', idPipe) id: number) {
    return this.generoService.buscarPorId(id);
  }

  @Patch(':id')
  actualizar(
    @Param('id', idPipe) id: number,
    @Body() dto: ActualizarGeneroDto,
  ) {
    return this.generoService.actualizar(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  eliminar(@Param('id', idPipe) id: number) {
    return this.generoService.eliminar(id);
  }
}
