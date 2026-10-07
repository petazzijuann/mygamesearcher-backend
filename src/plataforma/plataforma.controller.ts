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
  buscarPorId(@Param('id', idPipe) id: number) {
    return this.plataformaService.buscarPorId(id);
  }

  @ApiOperation({ summary: 'Modificar una plataforma (solo ADMIN)' })
  @Roles(Rol.ADMIN)
  @Patch(':id')
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
  eliminar(@Param('id', idPipe) id: number) {
    return this.plataformaService.eliminar(id);
  }
}
