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
import { Publico } from '../auth/decoradores/publico.decorator';
import { Roles } from '../auth/decoradores/roles.decorator';
import { idPipe } from '../comun/id.pipe';
import { Rol } from '../usuario/rol.enum';
import { ActualizarGeneroDto } from './dto/actualizar-genero.dto';
import { CrearGeneroDto } from './dto/crear-genero.dto';
import { GeneroService } from './genero.service';

@Controller('generos')
export class GeneroController {
  constructor(private readonly generoService: GeneroService) {}

  @Roles(Rol.ADMIN)
  @Post()
  crear(@Body() dto: CrearGeneroDto) {
    return this.generoService.crear(dto);
  }

  @Publico()
  @Get()
  listar() {
    return this.generoService.listar();
  }

  @Publico()
  @Get(':id')
  buscarPorId(@Param('id', idPipe) id: number) {
    return this.generoService.buscarPorId(id);
  }

  @Roles(Rol.ADMIN)
  @Patch(':id')
  actualizar(
    @Param('id', idPipe) id: number,
    @Body() dto: ActualizarGeneroDto,
  ) {
    return this.generoService.actualizar(id, dto);
  }

  @Roles(Rol.ADMIN)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  eliminar(@Param('id', idPipe) id: number) {
    return this.generoService.eliminar(id);
  }
}
