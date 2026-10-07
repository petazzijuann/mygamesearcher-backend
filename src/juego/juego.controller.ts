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
import { Publico } from '../auth/decoradores/publico.decorator';
import { Roles } from '../auth/decoradores/roles.decorator';
import { idPipe } from '../comun/id.pipe';
import { Rol } from '../usuario/rol.enum';
import { ActualizarJuegoDto } from './dto/actualizar-juego.dto';
import { CrearJuegoDto } from './dto/crear-juego.dto';
import { FiltroJuegosDto } from './dto/filtro-juegos.dto';
import { JuegoService } from './juego.service';

@Controller('juegos')
export class JuegoController {
  constructor(private readonly juegoService: JuegoService) {}

  @Roles(Rol.ADMIN)
  @Post()
  crear(@Body() dto: CrearJuegoDto) {
    return this.juegoService.crear(dto);
  }

  @Publico()
  @Get()
  listar(@Query() filtro: FiltroJuegosDto) {
    return this.juegoService.listar(filtro.titulo);
  }

  @Publico()
  @Get(':id')
  buscarPorId(@Param('id', idPipe) id: number) {
    return this.juegoService.buscarPorId(id);
  }

  @Roles(Rol.ADMIN)
  @Patch(':id')
  actualizar(@Param('id', idPipe) id: number, @Body() dto: ActualizarJuegoDto) {
    return this.juegoService.actualizar(id, dto);
  }

  @Roles(Rol.ADMIN)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  eliminar(@Param('id', idPipe) id: number) {
    return this.juegoService.eliminar(id);
  }
}
