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
import { UsuarioActual } from '../auth/decoradores/usuario-actual.decorator';
import type { UsuarioToken } from '../auth/usuario-token.interface';
import { idPipe } from '../comun/id.pipe';
import { ColeccionService } from './coleccion.service';
import { ActualizarColeccionDto } from './dto/actualizar-coleccion.dto';
import { AgregarJuegoDto } from './dto/agregar-juego.dto';
import { CrearColeccionDto } from './dto/crear-coleccion.dto';

// Todas las rutas piden sesión; el usuario sale del token
@Controller('colecciones')
export class ColeccionController {
  constructor(private readonly coleccionService: ColeccionService) {}

  @Post()
  crear(
    @Body() dto: CrearColeccionDto,
    @UsuarioActual() usuarioActual: UsuarioToken,
  ) {
    return this.coleccionService.crear(dto, usuarioActual);
  }

  @Get()
  listar(@UsuarioActual() usuarioActual: UsuarioToken) {
    return this.coleccionService.listar(usuarioActual);
  }

  @Get(':id')
  consultar(
    @Param('id', idPipe) id: number,
    @UsuarioActual() usuarioActual: UsuarioToken,
  ) {
    return this.coleccionService.consultar(id, usuarioActual);
  }

  @Patch(':id')
  actualizar(
    @Param('id', idPipe) id: number,
    @Body() dto: ActualizarColeccionDto,
    @UsuarioActual() usuarioActual: UsuarioToken,
  ) {
    return this.coleccionService.actualizar(id, dto, usuarioActual);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  eliminar(
    @Param('id', idPipe) id: number,
    @UsuarioActual() usuarioActual: UsuarioToken,
  ) {
    return this.coleccionService.eliminar(id, usuarioActual);
  }

  // CUU Administrar colección: agregar y quitar juegos de a uno
  @Post(':id/juegos')
  agregarJuego(
    @Param('id', idPipe) id: number,
    @Body() dto: AgregarJuegoDto,
    @UsuarioActual() usuarioActual: UsuarioToken,
  ) {
    return this.coleccionService.agregarJuego(id, dto.juegoId, usuarioActual);
  }

  @Delete(':id/juegos/:juegoId')
  @HttpCode(HttpStatus.NO_CONTENT)
  quitarJuego(
    @Param('id', idPipe) id: number,
    @Param('juegoId', idPipe) juegoId: number,
    @UsuarioActual() usuarioActual: UsuarioToken,
  ) {
    return this.coleccionService.quitarJuego(id, juegoId, usuarioActual);
  }
}
