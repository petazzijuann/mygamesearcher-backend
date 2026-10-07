import { PartialType } from '@nestjs/swagger';
import { CrearPlataformaDto } from './crear-plataforma.dto';

export class ActualizarPlataformaDto extends PartialType(CrearPlataformaDto) {}
