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
import { ActualizarPlataformaDto } from './dto/actualizar-plataforma.dto';
import { CrearPlataformaDto } from './dto/crear-plataforma.dto';
import { PlataformaService } from './plataforma.service';

@ApiTags('Plataformas')
@ApiBearerAuth()
@Controller('plataformas')
export class PlataformaController {
  constructor(private readonly plataformaService: PlataformaService) {}

  @ApiOperation({ summary: 'Crear una plataforma (solo ADMIN)' })
  @Roles(Rol.ADMIN)
  @Post()
  @ApiErrores(400, 401, 403, 409)
  crear(@Body() dto: CrearPlataformaDto) {
    return this.plataformaService.crear(dto);
  }

  @ApiOperation({ summary: 'Listar plataformas (público)' })
  @Publico()
  @Get()
  listar() {
    return this.plataformaService.listar();
  }

  @ApiOperation({ summary: 'Ver una plataforma por id (público)' })
  @Publico()
  @Get(':id')
  @ApiErrores(400, 404)
  buscarPorId(@Param('id', idPipe) id: number) {
    return this.plataformaService.buscarPorId(id);
  }

  @ApiOperation({ summary: 'Modificar una plataforma (solo ADMIN)' })
  @Roles(Rol.ADMIN)
  @Patch(':id')
  @ApiErrores(400, 401, 403, 404, 409)
  actualizar(
    @Param('id', idPipe) id: number,
    @Body() dto: ActualizarPlataformaDto,
  ) {
    return this.plataformaService.actualizar(id, dto);
  }

  @ApiOperation({
    summary: 'Eliminar una plataforma (solo ADMIN; 409 si algún juego la usa)',
  })
  @Roles(Rol.ADMIN)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiErrores(400, 401, 403, 404, 409)
  eliminar(@Param('id', idPipe) id: number) {
    return this.plataformaService.eliminar(id);
  }
}
