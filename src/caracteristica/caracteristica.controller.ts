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
import { CaracteristicaService } from './caracteristica.service';
import { ActualizarCaracteristicaDto } from './dto/actualizar-caracteristica.dto';
import { CrearCaracteristicaDto } from './dto/crear-caracteristica.dto';

@ApiTags('Características')
@ApiBearerAuth()
@Controller('caracteristicas')
export class CaracteristicaController {
  constructor(private readonly caracteristicaService: CaracteristicaService) {}

  @ApiOperation({ summary: 'Crear una característica (solo ADMIN)' })
  @Roles(Rol.ADMIN)
  @Post()
  crear(@Body() dto: CrearCaracteristicaDto) {
    return this.caracteristicaService.crear(dto);
  }

  @ApiOperation({ summary: 'Listar características (público)' })
  @Publico()
  @Get()
  listar() {
    return this.caracteristicaService.listar();
  }

  @ApiOperation({ summary: 'Ver una característica por id (público)' })
  @Publico()
  @Get(':id')
  buscarPorId(@Param('id', idPipe) id: number) {
    return this.caracteristicaService.buscarPorId(id);
  }

  @ApiOperation({ summary: 'Modificar una característica (solo ADMIN)' })
  @Roles(Rol.ADMIN)
  @Patch(':id')
  actualizar(
    @Param('id', idPipe) id: number,
    @Body() dto: ActualizarCaracteristicaDto,
  ) {
    return this.caracteristicaService.actualizar(id, dto);
  }

  @ApiOperation({
    summary:
      'Eliminar una característica (solo ADMIN; 409 si algún juego la usa)',
  })
  @Roles(Rol.ADMIN)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  eliminar(@Param('id', idPipe) id: number) {
    return this.caracteristicaService.eliminar(id);
  }
}
