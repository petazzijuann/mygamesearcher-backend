import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ActualizarGeneroDto } from './dto/actualizar-genero.dto';
import { CrearGeneroDto } from './dto/crear-genero.dto';
import { GeneroService } from './genero.service';

// ParseIntPipe con el mensaje de error en español
const idPipe = new ParseIntPipe({
  exceptionFactory: () =>
    new BadRequestException('El id debe ser un número entero'),
});

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
