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
import { UsuarioActual } from '../auth/decoradores/usuario-actual.decorator';
import type { UsuarioToken } from '../auth/usuario-token.interface';
import { idPipe } from '../comun/id.pipe';
import { ActualizarUsuarioDto } from './dto/actualizar-usuario.dto';
import { CambiarContrasenaDto } from './dto/cambiar-contrasena.dto';
import { CambiarRolDto } from './dto/cambiar-rol.dto';
import { CrearUsuarioDto } from './dto/crear-usuario.dto';
import { Rol } from './rol.enum';
import { UsuarioService } from './usuario.service';

@Controller('usuarios')
export class UsuarioController {
  constructor(private readonly usuarioService: UsuarioService) {}

  // Registro: cualquiera puede crear su cuenta (siempre con rol USUARIO)
  @Publico()
  @Post()
  registrar(@Body() dto: CrearUsuarioDto) {
    return this.usuarioService.registrar(dto);
  }

  @Roles(Rol.ADMIN)
  @Get()
  listar() {
    return this.usuarioService.listar();
  }

  // El propio usuario o un ADMIN (lo controla el service)
  @Get(':id')
  buscarPorId(
    @Param('id', idPipe) id: number,
    @UsuarioActual() usuarioActual: UsuarioToken,
  ) {
    return this.usuarioService.buscarPorId(id, usuarioActual);
  }

  @Patch(':id')
  actualizar(
    @Param('id', idPipe) id: number,
    @Body() dto: ActualizarUsuarioDto,
    @UsuarioActual() usuarioActual: UsuarioToken,
  ) {
    return this.usuarioService.actualizar(id, dto, usuarioActual);
  }

  // Solo el propio usuario; sin contenido en la respuesta
  @Patch(':id/contrasena')
  @HttpCode(HttpStatus.NO_CONTENT)
  cambiarContrasena(
    @Param('id', idPipe) id: number,
    @Body() dto: CambiarContrasenaDto,
    @UsuarioActual() usuarioActual: UsuarioToken,
  ) {
    return this.usuarioService.cambiarContrasena(id, dto, usuarioActual);
  }

  @Roles(Rol.ADMIN)
  @Patch(':id/rol')
  cambiarRol(@Param('id', idPipe) id: number, @Body() dto: CambiarRolDto) {
    return this.usuarioService.cambiarRol(id, dto.rol);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  eliminar(
    @Param('id', idPipe) id: number,
    @UsuarioActual() usuarioActual: UsuarioToken,
  ) {
    return this.usuarioService.eliminar(id, usuarioActual);
  }
}
