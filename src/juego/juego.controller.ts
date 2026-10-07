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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Publico } from '../auth/decoradores/publico.decorator';
import { Roles } from '../auth/decoradores/roles.decorator';
import { idPipe } from '../comun/id.pipe';
import { Rol } from '../usuario/rol.enum';
import { ActualizarJuegoDto } from './dto/actualizar-juego.dto';
import { CrearJuegoDto } from './dto/crear-juego.dto';
import { FiltroJuegosDto } from './dto/filtro-juegos.dto';
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
  crear(@Body() dto: CrearJuegoDto) {
    return this.juegoService.crear(dto);
  }

  @ApiOperation({
    summary: 'Listar juegos, con filtro opcional por título (público)',
  })
  @Publico()
  @Get()
  listar(@Query() filtro: FiltroJuegosDto) {
    return this.juegoService.listar(filtro.titulo);
  }

  @ApiOperation({ summary: 'Ver el detalle de un juego (público)' })
  @Publico()
  @Get(':id')
  buscarPorId(@Param('id', idPipe) id: number) {
    return this.juegoService.buscarPorId(id);
  }

  @ApiOperation({
    summary:
      'Modificar un juego; las listas de ids enviadas reemplazan a las anteriores (solo ADMIN)',
  })
  @Roles(Rol.ADMIN)
  @Patch(':id')
  actualizar(@Param('id', idPipe) id: number, @Body() dto: ActualizarJuegoDto) {
    return this.juegoService.actualizar(id, dto);
  }

  @ApiOperation({ summary: 'Eliminar un juego (solo ADMIN)' })
  @Roles(Rol.ADMIN)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  eliminar(@Param('id', idPipe) id: number) {
    return this.juegoService.eliminar(id);
  }
}
