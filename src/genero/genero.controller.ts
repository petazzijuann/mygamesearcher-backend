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
import { idPipe } from '../comun/id.pipe';
import { Rol } from '../usuario/rol.enum';
import { ActualizarGeneroDto } from './dto/actualizar-genero.dto';
import { CrearGeneroDto } from './dto/crear-genero.dto';
import { GeneroService } from './genero.service';

@ApiTags('Géneros')
@ApiBearerAuth()
@Controller('generos')
export class GeneroController {
  constructor(private readonly generoService: GeneroService) {}

  @ApiOperation({ summary: 'Crear un género (solo ADMIN)' })
  @Roles(Rol.ADMIN)
  @Post()
  @ApiErrores(400, 401, 403, 409)
  crear(@Body() dto: CrearGeneroDto) {
    return this.generoService.crear(dto);
  }

  @ApiOperation({ summary: 'Listar géneros (público)' })
  @Publico()
  @Get()
  listar() {
    return this.generoService.listar();
  }

  @ApiOperation({ summary: 'Ver un género por id (público)' })
  @Publico()
  @Get(':id')
  @ApiErrores(400, 404)
  buscarPorId(@Param('id', idPipe) id: number) {
    return this.generoService.buscarPorId(id);
  }

  @ApiOperation({ summary: 'Modificar un género (solo ADMIN)' })
  @Roles(Rol.ADMIN)
  @Patch(':id')
  @ApiErrores(400, 401, 403, 404, 409)
  actualizar(
    @Param('id', idPipe) id: number,
    @Body() dto: ActualizarGeneroDto,
  ) {
    return this.generoService.actualizar(id, dto);
  }

  @ApiOperation({
    summary: 'Eliminar un género (solo ADMIN; 409 si algún juego lo usa)',
  })
  @Roles(Rol.ADMIN)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiErrores(400, 401, 403, 404, 409)
  eliminar(@Param('id', idPipe) id: number) {
    return this.generoService.eliminar(id);
  }
}
