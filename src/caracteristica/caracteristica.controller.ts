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
import { idPipe } from '../comun/id.pipe';
import { Rol } from '../usuario/rol.enum';
import { CaracteristicaService } from './caracteristica.service';
import { ActualizarCaracteristicaDto } from './dto/actualizar-caracteristica.dto';
import { CrearCaracteristicaDto } from './dto/crear-caracteristica.dto';

@Controller('caracteristicas')
export class CaracteristicaController {
  constructor(private readonly caracteristicaService: CaracteristicaService) {}

  @Roles(Rol.ADMIN)
  @Post()
  crear(@Body() dto: CrearCaracteristicaDto) {
    return this.caracteristicaService.crear(dto);
  }

  @Publico()
  @Get()
  listar() {
    return this.caracteristicaService.listar();
  }

  @Publico()
  @Get(':id')
  buscarPorId(@Param('id', idPipe) id: number) {
    return this.caracteristicaService.buscarPorId(id);
  }

  @Roles(Rol.ADMIN)
  @Patch(':id')
  actualizar(
    @Param('id', idPipe) id: number,
    @Body() dto: ActualizarCaracteristicaDto,
  ) {
    return this.caracteristicaService.actualizar(id, dto);
  }

  @Roles(Rol.ADMIN)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  eliminar(@Param('id', idPipe) id: number) {
    return this.caracteristicaService.eliminar(id);
  }
}
