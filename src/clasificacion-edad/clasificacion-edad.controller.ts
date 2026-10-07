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
import { ClasificacionEdadService } from './clasificacion-edad.service';
import { ActualizarClasificacionEdadDto } from './dto/actualizar-clasificacion-edad.dto';
import { CrearClasificacionEdadDto } from './dto/crear-clasificacion-edad.dto';

@Controller('clasificaciones-edad')
export class ClasificacionEdadController {
  constructor(
    private readonly clasificacionEdadService: ClasificacionEdadService,
  ) {}

  @Roles(Rol.ADMIN)
  @Post()
  crear(@Body() dto: CrearClasificacionEdadDto) {
    return this.clasificacionEdadService.crear(dto);
  }

  @Publico()
  @Get()
  listar() {
    return this.clasificacionEdadService.listar();
  }

  @Publico()
  @Get(':id')
  buscarPorId(@Param('id', idPipe) id: number) {
    return this.clasificacionEdadService.buscarPorId(id);
  }

  @Roles(Rol.ADMIN)
  @Patch(':id')
  actualizar(
    @Param('id', idPipe) id: number,
    @Body() dto: ActualizarClasificacionEdadDto,
  ) {
    return this.clasificacionEdadService.actualizar(id, dto);
  }

  @Roles(Rol.ADMIN)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  eliminar(@Param('id', idPipe) id: number) {
    return this.clasificacionEdadService.eliminar(id);
  }
}
