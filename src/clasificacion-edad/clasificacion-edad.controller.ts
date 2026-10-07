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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Publico } from '../auth/decoradores/publico.decorator';
import { Roles } from '../auth/decoradores/roles.decorator';
import { idPipe } from '../comun/id.pipe';
import { Rol } from '../usuario/rol.enum';
import { ClasificacionEdadService } from './clasificacion-edad.service';
import { ActualizarClasificacionEdadDto } from './dto/actualizar-clasificacion-edad.dto';
import { CrearClasificacionEdadDto } from './dto/crear-clasificacion-edad.dto';

@ApiTags('Clasificaciones de edad')
@ApiBearerAuth()
@Controller('clasificaciones-edad')
export class ClasificacionEdadController {
  constructor(
    private readonly clasificacionEdadService: ClasificacionEdadService,
  ) {}

  @ApiOperation({ summary: 'Crear una clasificación de edad (solo ADMIN)' })
  @Roles(Rol.ADMIN)
  @Post()
  crear(@Body() dto: CrearClasificacionEdadDto) {
    return this.clasificacionEdadService.crear(dto);
  }

  @ApiOperation({ summary: 'Listar clasificaciones de edad (público)' })
  @Publico()
  @Get()
  listar() {
    return this.clasificacionEdadService.listar();
  }

  @ApiOperation({ summary: 'Ver una clasificación de edad por id (público)' })
  @Publico()
  @Get(':id')
  buscarPorId(@Param('id', idPipe) id: number) {
    return this.clasificacionEdadService.buscarPorId(id);
  }

  @ApiOperation({ summary: 'Modificar una clasificación de edad (solo ADMIN)' })
  @Roles(Rol.ADMIN)
  @Patch(':id')
  actualizar(
    @Param('id', idPipe) id: number,
    @Body() dto: ActualizarClasificacionEdadDto,
  ) {
    return this.clasificacionEdadService.actualizar(id, dto);
  }

  @ApiOperation({
    summary:
      'Eliminar una clasificación de edad (solo ADMIN; 409 si algún juego la usa)',
  })
  @Roles(Rol.ADMIN)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  eliminar(@Param('id', idPipe) id: number) {
    return this.clasificacionEdadService.eliminar(id);
  }
}
