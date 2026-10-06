import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActualizarPlataformaDto } from './dto/actualizar-plataforma.dto';
import { CrearPlataformaDto } from './dto/crear-plataforma.dto';
import { Plataforma } from './plataforma.entity';

@Injectable()
export class PlataformaService {
  constructor(
    @InjectRepository(Plataforma)
    private readonly plataformaRepository: Repository<Plataforma>,
  ) {}

  async crear(dto: CrearPlataformaDto): Promise<Plataforma> {
    await this.validarNombreDisponible(dto.nombre);
    const plataforma = this.plataformaRepository.create(dto);
    return this.plataformaRepository.save(plataforma);
  }

  listar(): Promise<Plataforma[]> {
    return this.plataformaRepository.find({ order: { nombre: 'ASC' } });
  }

  async buscarPorId(id: number): Promise<Plataforma> {
    const plataforma = await this.plataformaRepository.findOneBy({ id });
    if (!plataforma) {
      throw new NotFoundException(`No se encontró la plataforma con id ${id}`);
    }
    return plataforma;
  }

  async actualizar(
    id: number,
    dto: ActualizarPlataformaDto,
  ): Promise<Plataforma> {
    const plataforma = await this.buscarPorId(id);
    if (dto.nombre !== undefined) {
      await this.validarNombreDisponible(dto.nombre, id);
    }
    this.plataformaRepository.merge(plataforma, dto);
    return this.plataformaRepository.save(plataforma);
  }

  async eliminar(id: number): Promise<void> {
    const plataforma = await this.buscarPorId(id);
    await this.plataformaRepository.remove(plataforma);
  }

  // Compara sin distinguir mayúsculas; idExcluido evita chocar con la propia plataforma al actualizar
  private async validarNombreDisponible(
    nombre: string,
    idExcluido?: number,
  ): Promise<void> {
    const consulta = this.plataformaRepository
      .createQueryBuilder('plataforma')
      .where('LOWER(plataforma.nombre) = LOWER(:nombre)', { nombre });
    if (idExcluido !== undefined) {
      consulta.andWhere('plataforma.id != :idExcluido', { idExcluido });
    }
    if (await consulta.getExists()) {
      throw new ConflictException(
        `Ya existe una plataforma con el nombre '${nombre}'`,
      );
    }
  }
}
