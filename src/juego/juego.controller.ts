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
import { ApiErrores } from '../comun/documentacion';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Publico } from '../auth/decoradores/publico.decorator';
import { Roles } from '../auth/decoradores/roles.decorator';
import { idPipe } from '../comun/id.pipe';
import { Rol } from '../usuario/rol.enum';
import { ActualizarJuegoDto } from './dto/actualizar-juego.dto';
import { CrearJuegoDto } from './dto/crear-juego.dto';
import { FiltroJuegosDto } from './dto/filtro-juegos.dto';
import { JuegosPaginadosDto } from './dto/juegos-paginados.dto';
import { JuegoService } from './juego.service';

@ApiTags('Juegos')
@ApiBearerAuth()
@Controller('juegos')
export class JuegoController {
  constructor(private readonly juegoService: JuegoService) {}

  @ApiOperation({
    summary:
      'Crear un juego con su clasificación, plataformas, géneros y características (solo ADMIN)',
  })
  @Roles(Rol.ADMIN)
  @Post()
  @ApiErrores(400, 401, 403, 409)
  crear(@Body() dto: CrearJuegoDto) {
    return this.juegoService.crear(dto);
  }

  @ApiOperation({
    summary:
      'Listar juegos paginados, con filtro opcional por título (público). Por defecto devuelve la página 1 con 20 juegos; limite admite hasta 100',
  })
  @Publico()
  @Get()
  @ApiOkResponse({ type: JuegosPaginadosDto })
  @ApiErrores(400)
  listar(@Query() filtro: FiltroJuegosDto) {
    return this.juegoService.listar(filtro);
  }

  @ApiOperation({ summary: 'Ver el detalle de un juego (público)' })
  @Publico()
  @Get(':id')
  @ApiErrores(400, 404)
  buscarPorId(@Param('id', idPipe) id: number) {
    return this.juegoService.buscarPorId(id);
  }

  @ApiOperation({
    summary:
      'Modificar un juego; las listas de ids enviadas reemplazan a las anteriores (solo ADMIN)',
  })
  @Roles(Rol.ADMIN)
  @Patch(':id')
  @ApiErrores(400, 401, 403, 404, 409)
  actualizar(@Param('id', idPipe) id: number, @Body() dto: ActualizarJuegoDto) {
    return this.juegoService.actualizar(id, dto);
  }

  @ApiOperation({ summary: 'Eliminar un juego (solo ADMIN)' })
  @Roles(Rol.ADMIN)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiErrores(400, 401, 403, 404)
  eliminar(@Param('id', idPipe) id: number) {
    return this.juegoService.eliminar(id);
  }
}
