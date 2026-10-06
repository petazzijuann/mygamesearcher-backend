import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActualizarGeneroDto } from './dto/actualizar-genero.dto';
import { CrearGeneroDto } from './dto/crear-genero.dto';
import { Genero } from './genero.entity';

@Injectable()
export class GeneroService {
  constructor(
    @InjectRepository(Genero)
    private readonly generoRepository: Repository<Genero>,
  ) {}

  async crear(dto: CrearGeneroDto): Promise<Genero> {
    await this.validarNombreDisponible(dto.nombre);
    const genero = this.generoRepository.create(dto);
    return this.generoRepository.save(genero);
  }

  listar(): Promise<Genero[]> {
    return this.generoRepository.find({ order: { nombre: 'ASC' } });
  }

  async buscarPorId(id: number): Promise<Genero> {
    const genero = await this.generoRepository.findOneBy({ id });
    if (!genero) {
      throw new NotFoundException(`No se encontró el género con id ${id}`);
    }
    return genero;
  }

  async actualizar(id: number, dto: ActualizarGeneroDto): Promise<Genero> {
    const genero = await this.buscarPorId(id);
    if (dto.nombre !== undefined) {
      await this.validarNombreDisponible(dto.nombre, id);
    }
    this.generoRepository.merge(genero, dto);
    return this.generoRepository.save(genero);
  }

  async eliminar(id: number): Promise<void> {
    const genero = await this.buscarPorId(id);
    await this.generoRepository.remove(genero);
  }

  // Compara sin distinguir mayúsculas; idExcluido evita chocar con el propio género al actualizar
  private async validarNombreDisponible(
    nombre: string,
    idExcluido?: number,
  ): Promise<void> {
    const consulta = this.generoRepository
      .createQueryBuilder('genero')
      .where('LOWER(genero.nombre) = LOWER(:nombre)', { nombre });
    if (idExcluido !== undefined) {
      consulta.andWhere('genero.id != :idExcluido', { idExcluido });
    }
    if (await consulta.getExists()) {
      throw new ConflictException(
        `Ya existe un género con el nombre '${nombre}'`,
      );
    }
  }
}
