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
import { UsuarioQueryDto } from '../comun/usuario-query.dto';
import { CambiarEstadoDto } from './dto/cambiar-estado.dto';
import { FiltroBibliotecaDto } from './dto/filtro-biblioteca.dto';
import { GuardarJuegoDto } from './dto/guardar-juego.dto';
import { JuegoGuardadoService } from './juego-guardado.service';

// CUU Administrar biblioteca personal
@Controller('biblioteca')
export class JuegoGuardadoController {
  constructor(private readonly juegoGuardadoService: JuegoGuardadoService) {}

  @Get()
  listar(@Query() filtro: FiltroBibliotecaDto) {
    return this.juegoGuardadoService.listar(filtro.usuarioId, filtro.estado);
  }

  @Post()
  guardar(@Body() dto: GuardarJuegoDto) {
    return this.juegoGuardadoService.guardar(dto);
  }

  @Patch(':juegoId')
  cambiarEstado(
    @Param('juegoId', idPipe) juegoId: number,
    @Body() dto: CambiarEstadoDto,
  ) {
    return this.juegoGuardadoService.cambiarEstado(juegoId, dto);
  }

  @Delete(':juegoId')
  @HttpCode(HttpStatus.NO_CONTENT)
  quitar(
    @Param('juegoId', idPipe) juegoId: number,
    @Query() query: UsuarioQueryDto,
  ) {
    return this.juegoGuardadoService.quitar(juegoId, query.usuarioId);
  }
}
