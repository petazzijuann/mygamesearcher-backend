import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Caracteristica } from './caracteristica.entity';
import { ActualizarCaracteristicaDto } from './dto/actualizar-caracteristica.dto';
import { CrearCaracteristicaDto } from './dto/crear-caracteristica.dto';

@Injectable()
export class CaracteristicaService {
  constructor(
    @InjectRepository(Caracteristica)
    private readonly caracteristicaRepository: Repository<Caracteristica>,
  ) {}

  async crear(dto: CrearCaracteristicaDto): Promise<Caracteristica> {
    await this.validarNombreDisponible(dto.nombre);
    const caracteristica = this.caracteristicaRepository.create(dto);
    return this.caracteristicaRepository.save(caracteristica);
  }

  listar(): Promise<Caracteristica[]> {
    return this.caracteristicaRepository.find({ order: { nombre: 'ASC' } });
  }

  async buscarPorId(id: number): Promise<Caracteristica> {
    const caracteristica = await this.caracteristicaRepository.findOneBy({
      id,
    });
    if (!caracteristica) {
      throw new NotFoundException(
        `No se encontró la característica con id ${id}`,
      );
    }
    return caracteristica;
  }

  async actualizar(
    id: number,
    dto: ActualizarCaracteristicaDto,
  ): Promise<Caracteristica> {
    const caracteristica = await this.buscarPorId(id);
    if (dto.nombre !== undefined) {
      await this.validarNombreDisponible(dto.nombre, id);
    }
    this.caracteristicaRepository.merge(caracteristica, dto);
    return this.caracteristicaRepository.save(caracteristica);
  }

  async eliminar(id: number): Promise<void> {
    const caracteristica = await this.buscarPorId(id);
    await this.caracteristicaRepository.remove(caracteristica);
  }

  // Compara sin distinguir mayúsculas; idExcluido evita chocar con la propia característica al actualizar
  private async validarNombreDisponible(
    nombre: string,
    idExcluido?: number,
  ): Promise<void> {
    const consulta = this.caracteristicaRepository
      .createQueryBuilder('caracteristica')
      .where('LOWER(caracteristica.nombre) = LOWER(:nombre)', { nombre });
    if (idExcluido !== undefined) {
      consulta.andWhere('caracteristica.id != :idExcluido', { idExcluido });
    }
    if (await consulta.getExists()) {
      throw new ConflictException(
        `Ya existe una característica con el nombre '${nombre}'`,
      );
    }
  }
}
