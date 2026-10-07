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
import { ActualizarUsuarioDto } from './dto/actualizar-usuario.dto';
import { CambiarContrasenaDto } from './dto/cambiar-contrasena.dto';
import { CrearUsuarioDto } from './dto/crear-usuario.dto';
import { UsuarioService } from './usuario.service';

@Controller('usuarios')
export class UsuarioController {
  constructor(private readonly usuarioService: UsuarioService) {}

  @Post()
  registrar(@Body() dto: CrearUsuarioDto) {
    return this.usuarioService.registrar(dto);
  }

  @Get()
  listar() {
    return this.usuarioService.listar();
  }

  @Get(':id')
  buscarPorId(@Param('id', idPipe) id: number) {
    return this.usuarioService.buscarPorId(id);
  }

  @Patch(':id')
  actualizar(
    @Param('id', idPipe) id: number,
    @Body() dto: ActualizarUsuarioDto,
  ) {
    return this.usuarioService.actualizar(id, dto);
  }

  // Sin contenido en la respuesta: no hay nada que devolver
  @Patch(':id/contrasena')
  @HttpCode(HttpStatus.NO_CONTENT)
  cambiarContrasena(
    @Param('id', idPipe) id: number,
    @Body() dto: CambiarContrasenaDto,
  ) {
    return this.usuarioService.cambiarContrasena(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  eliminar(@Param('id', idPipe) id: number) {
    return this.usuarioService.eliminar(id);
  }
}
