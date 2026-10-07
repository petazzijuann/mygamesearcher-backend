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
import { ApiErrores } from '../comun/documentacion';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
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

@ApiTags('Usuarios')
@ApiBearerAuth()
@Controller('usuarios')
export class UsuarioController {
  constructor(private readonly usuarioService: UsuarioService) {}

  // Registro: cualquiera puede crear su cuenta (siempre con rol USUARIO)
  @ApiOperation({
    summary: 'Registrarse: crea un usuario con rol USUARIO (público)',
  })
  @Publico()
  @Post()
  @ApiErrores(400, 409)
  registrar(@Body() dto: CrearUsuarioDto) {
    return this.usuarioService.registrar(dto);
  }

  @ApiOperation({ summary: 'Listar todos los usuarios (solo ADMIN)' })
  @Roles(Rol.ADMIN)
  @Get()
  @ApiErrores(401, 403)
  listar() {
    return this.usuarioService.listar();
  }

  // El propio usuario o un ADMIN (lo controla el service)
  @ApiOperation({ summary: 'Ver un usuario (el propio usuario o un ADMIN)' })
  @Get(':id')
  @ApiErrores(400, 401, 403, 404)
  buscarPorId(
    @Param('id', idPipe) id: number,
    @UsuarioActual() usuarioActual: UsuarioToken,
  ) {
    return this.usuarioService.buscarPorId(id, usuarioActual);
  }

  @ApiOperation({
    summary:
      'Modificar nombre, apellido, email o plataforma favorita (el propio usuario o un ADMIN)',
  })
  @Patch(':id')
  @ApiErrores(400, 401, 403, 404, 409)
  actualizar(
    @Param('id', idPipe) id: number,
    @Body() dto: ActualizarUsuarioDto,
    @UsuarioActual() usuarioActual: UsuarioToken,
  ) {
    return this.usuarioService.actualizar(id, dto, usuarioActual);
  }

  // Solo el propio usuario; sin contenido en la respuesta
  @ApiOperation({
    summary:
      'Cambiar la contraseña indicando la actual (solo el propio usuario)',
  })
  @Patch(':id/contrasena')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiErrores(400, 401, 403, 404)
  cambiarContrasena(
    @Param('id', idPipe) id: number,
    @Body() dto: CambiarContrasenaDto,
    @UsuarioActual() usuarioActual: UsuarioToken,
  ) {
    return this.usuarioService.cambiarContrasena(id, dto, usuarioActual);
  }

  @ApiOperation({
    summary:
      'Cambiar el rol de un usuario (solo ADMIN; 409 si es el último ADMIN)',
  })
  @Roles(Rol.ADMIN)
  @Patch(':id/rol')
  @ApiErrores(400, 401, 403, 404, 409)
  cambiarRol(@Param('id', idPipe) id: number, @Body() dto: CambiarRolDto) {
    return this.usuarioService.cambiarRol(id, dto.rol);
  }

  @ApiOperation({
    summary:
      'Eliminar un usuario y todos sus datos (el propio usuario o un ADMIN)',
  })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiErrores(400, 401, 403, 404, 409)
  eliminar(
    @Param('id', idPipe) id: number,
    @UsuarioActual() usuarioActual: UsuarioToken,
  ) {
    return this.usuarioService.eliminar(id, usuarioActual);
  }
}
