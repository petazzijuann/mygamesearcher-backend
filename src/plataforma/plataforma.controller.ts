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
import { idPipe } from '../comun/id.pipe';
import { ActualizarPlataformaDto } from './dto/actualizar-plataforma.dto';
import { CrearPlataformaDto } from './dto/crear-plataforma.dto';
import { PlataformaService } from './plataforma.service';

@Controller('plataformas')
export class PlataformaController {
  constructor(private readonly plataformaService: PlataformaService) {}

  @Post()
  crear(@Body() dto: CrearPlataformaDto) {
    return this.plataformaService.crear(dto);
  }

  @Get()
  listar() {
    return this.plataformaService.listar();
  }

  @Get(':id')
  buscarPorId(@Param('id', idPipe) id: number) {
    return this.plataformaService.buscarPorId(id);
  }

  @Patch(':id')
  actualizar(
    @Param('id', idPipe) id: number,
    @Body() dto: ActualizarPlataformaDto,
  ) {
    return this.plataformaService.actualizar(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  eliminar(@Param('id', idPipe) id: number) {
    return this.plataformaService.eliminar(id);
  }
}
