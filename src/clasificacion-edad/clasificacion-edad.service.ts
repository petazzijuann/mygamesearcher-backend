import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClasificacionEdad } from './clasificacion-edad.entity';
import { ActualizarClasificacionEdadDto } from './dto/actualizar-clasificacion-edad.dto';
import { CrearClasificacionEdadDto } from './dto/crear-clasificacion-edad.dto';

@Injectable()
export class ClasificacionEdadService {
  constructor(
    @InjectRepository(ClasificacionEdad)
    private readonly clasificacionEdadRepository: Repository<ClasificacionEdad>,
  ) {}

  async crear(dto: CrearClasificacionEdadDto): Promise<ClasificacionEdad> {
    await this.validarNombreDisponible(dto.nombre);
    const clasificacion = this.clasificacionEdadRepository.create(dto);
    return this.clasificacionEdadRepository.save(clasificacion);
  }

  listar(): Promise<ClasificacionEdad[]> {
    return this.clasificacionEdadRepository.find({ order: { nombre: 'ASC' } });
  }

  async buscarPorId(id: number): Promise<ClasificacionEdad> {
    const clasificacion = await this.clasificacionEdadRepository.findOneBy({
      id,
    });
    if (!clasificacion) {
      throw new NotFoundException(
        `No se encontró la clasificación de edad con id ${id}`,
      );
    }
    return clasificacion;
  }

  async actualizar(
    id: number,
    dto: ActualizarClasificacionEdadDto,
  ): Promise<ClasificacionEdad> {
    const clasificacion = await this.buscarPorId(id);
    if (dto.nombre !== undefined) {
      await this.validarNombreDisponible(dto.nombre, id);
    }
    this.clasificacionEdadRepository.merge(clasificacion, dto);
    return this.clasificacionEdadRepository.save(clasificacion);
  }

  async eliminar(id: number): Promise<void> {
    const clasificacion = await this.buscarPorId(id);
    await this.clasificacionEdadRepository.remove(clasificacion);
  }

  // Compara sin distinguir mayúsculas; idExcluido evita chocar con la propia clasificación al actualizar
  private async validarNombreDisponible(
    nombre: string,
    idExcluido?: number,
  ): Promise<void> {
    const consulta = this.clasificacionEdadRepository
      .createQueryBuilder('clasificacion')
      .where('LOWER(clasificacion.nombre) = LOWER(:nombre)', { nombre });
    if (idExcluido !== undefined) {
      consulta.andWhere('clasificacion.id != :idExcluido', { idExcluido });
    }
    if (await consulta.getExists()) {
      throw new ConflictException(
        `Ya existe una clasificación de edad con el nombre '${nombre}'`,
      );
    }
  }
}
