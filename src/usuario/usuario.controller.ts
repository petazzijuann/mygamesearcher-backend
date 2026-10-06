import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { idPipe } from '../comun/id.pipe';
import { CrearUsuarioDto } from './dto/crear-usuario.dto';
import { UsuarioService } from './usuario.service';

@Controller('usuarios')
export class UsuarioController {
  constructor(private readonly usuarioService: UsuarioService) {}

  @Post()
  registrar(@Body() dto: CrearUsuarioDto) {
    return this.usuarioService.registrar(dto);
  }

  @Get(':id')
  buscarPorId(@Param('id', idPipe) id: number) {
    return this.usuarioService.buscarPorId(id);
  }
}
