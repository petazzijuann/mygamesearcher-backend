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
import { UsuarioActual } from '../auth/decoradores/usuario-actual.decorator';
import type { UsuarioToken } from '../auth/usuario-token.interface';
import { idPipe } from '../comun/id.pipe';
import { CambiarEstadoDto } from './dto/cambiar-estado.dto';
import { FiltroBibliotecaDto } from './dto/filtro-biblioteca.dto';
import { GuardarJuegoDto } from './dto/guardar-juego.dto';
import { JuegoGuardadoService } from './juego-guardado.service';

// CUU Administrar biblioteca personal: siempre la biblioteca del usuario del token
@Controller('biblioteca')
export class JuegoGuardadoController {
  constructor(private readonly juegoGuardadoService: JuegoGuardadoService) {}

  @Get()
  listar(
    @Query() filtro: FiltroBibliotecaDto,
    @UsuarioActual() usuarioActual: UsuarioToken,
  ) {
    return this.juegoGuardadoService.listar(usuarioActual.id, filtro.estado);
  }

  @Post()
  guardar(
    @Body() dto: GuardarJuegoDto,
    @UsuarioActual() usuarioActual: UsuarioToken,
  ) {
    return this.juegoGuardadoService.guardar(dto, usuarioActual.id);
  }

  @Patch(':juegoId')
  cambiarEstado(
    @Param('juegoId', idPipe) juegoId: number,
    @Body() dto: CambiarEstadoDto,
    @UsuarioActual() usuarioActual: UsuarioToken,
  ) {
    return this.juegoGuardadoService.cambiarEstado(
      juegoId,
      dto,
      usuarioActual.id,
    );
  }

  @Delete(':juegoId')
  @HttpCode(HttpStatus.NO_CONTENT)
  quitar(
    @Param('juegoId', idPipe) juegoId: number,
    @UsuarioActual() usuarioActual: UsuarioToken,
  ) {
    return this.juegoGuardadoService.quitar(juegoId, usuarioActual.id);
  }
}
