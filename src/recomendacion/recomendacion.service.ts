import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Busqueda } from '../busqueda/busqueda.entity';
import { Caracteristica } from '../caracteristica/caracteristica.entity';
import { buscarPorIds } from '../comun/buscar-por-ids';
import { Genero } from '../genero/genero.entity';
import { Juego } from '../juego/juego.entity';
import { EstadoJuego } from '../juego-guardado/estado-juego.enum';
import { Plataforma } from '../plataforma/plataforma.entity';
import { Usuario } from '../usuario/usuario.entity';
import { GenerarRecomendacionDto } from './dto/generar-recomendacion.dto';

// Cantidad máxima de juegos recomendados por búsqueda
const MAXIMO_RECOMENDACIONES = 3;

// Peso de cada coincidencia en el puntaje: el género es el criterio principal
const PUNTOS_POR_GENERO = 2;
const PUNTOS_POR_CARACTERISTICA = 1;

// Relaciones del juego que se devuelven en cada recomendación
const RELACIONES_JUEGO = {
  clasificacionEdad: true,
  plataformas: true,
  generos: true,
  caracteristicas: true,
};

@Injectable()
export class RecomendacionService {
  constructor(
    @InjectRepository(Busqueda)
    private readonly busquedaRepository: Repository<Busqueda>,
    @InjectRepository(Juego)
    private readonly juegoRepository: Repository<Juego>,
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
    @InjectRepository(Plataforma)
    private readonly plataformaRepository: Repository<Plataforma>,
    @InjectRepository(Genero)
    private readonly generoRepository: Repository<Genero>,
    @InjectRepository(Caracteristica)
    private readonly caracteristicaRepository: Repository<Caracteristica>,
  ) {}

  // CUU Generar recomendación personalizada
  async generar(dto: GenerarRecomendacionDto): Promise<Busqueda> {
    const { usuarioId, plataformaIds, generoIds } = dto;
    const caracteristicaIds = dto.caracteristicaIds ?? [];

    // 1. Validar los datos del body
    const usuario = await this.usuarioRepository.findOneBy({ id: usuarioId });
    if (!usuario) {
      throw new BadRequestException(`No existe el usuario con id ${usuarioId}`);
    }
    const plataformas = await buscarPorIds(
      this.plataformaRepository,
      plataformaIds,
      'las plataformas',
    );
    const generos = await buscarPorIds(
      this.generoRepository,
      generoIds,
      'los géneros',
    );
    const caracteristicas = await buscarPorIds(
      this.caracteristicaRepository,
      caracteristicaIds,
      'las características',
    );

    // 2 a 4. Buscar candidatos, puntuarlos y quedarse con los mejores
    const candidatos = await this.buscarCandidatos(
      usuarioId,
      plataformaIds,
      generoIds,
    );
    const elegidos = candidatos
      .map((juego) => ({
        juego,
        puntaje: this.calcularPuntaje(juego, generoIds, caracteristicaIds),
      }))
      .sort(
        (a, b) =>
          b.puntaje - a.puntaje ||
          b.juego.anioLanzamiento - a.juego.anioLanzamiento ||
          a.juego.titulo.localeCompare(b.juego.titulo, 'es'),
      )
      .slice(0, MAXIMO_RECOMENDACIONES);

    // 5. Sin candidatos no se guarda nada (cada búsqueda tiene de 1 a 3 recomendaciones)
    if (elegidos.length === 0) {
      throw new NotFoundException(
        'No hay juegos que coincidan con los criterios elegidos',
      );
    }

    // 6. Guardar la búsqueda y sus recomendaciones en una sola transacción (cascade insert)
    const busqueda = this.busquedaRepository.create({
      usuario,
      plataformas,
      generos,
      caracteristicas,
      recomendaciones: elegidos.map(({ juego }, indice) => ({
        juego,
        orden: indice + 1,
      })),
    });
    const guardada = await this.busquedaRepository.save(busqueda);

    // 7. Devolver la búsqueda con sus recomendaciones ordenadas
    return this.buscarBusqueda(guardada.id);
  }

  // Juegos en alguna de las plataformas y con alguno de los géneros elegidos,
  // sin los que el usuario marcó como YA_JUGADO en su biblioteca
  private async buscarCandidatos(
    usuarioId: number,
    plataformaIds: number[],
    generoIds: number[],
  ): Promise<Juego[]> {
    const filas = await this.juegoRepository
      .createQueryBuilder('juego')
      .select('juego.id', 'id')
      .distinct(true)
      .innerJoin(
        'juego.plataformas',
        'plataforma',
        'plataforma.id IN (:...plataformaIds)',
        { plataformaIds },
      )
      .innerJoin('juego.generos', 'genero', 'genero.id IN (:...generoIds)', {
        generoIds,
      })
      .where(
        `NOT EXISTS (
          SELECT 1 FROM juego_guardado jg
          WHERE jg.juego_id = juego.id
            AND jg.usuario_id = :usuarioId
            AND jg.estado = :yaJugado
        )`,
        { usuarioId, yaJugado: EstadoJuego.YA_JUGADO },
      )
      .getRawMany<{ id: number }>();

    if (filas.length === 0) {
      return [];
    }
    return this.juegoRepository.find({
      where: { id: In(filas.map((fila) => fila.id)) },
      relations: RELACIONES_JUEGO,
    });
  }

  private calcularPuntaje(
    juego: Juego,
    generoIds: number[],
    caracteristicaIds: number[],
  ): number {
    const generosEnComun = juego.generos.filter((genero) =>
      generoIds.includes(genero.id),
    ).length;
    const caracteristicasEnComun = juego.caracteristicas.filter(
      (caracteristica) => caracteristicaIds.includes(caracteristica.id),
    ).length;
    return (
      generosEnComun * PUNTOS_POR_GENERO +
      caracteristicasEnComun * PUNTOS_POR_CARACTERISTICA
    );
  }

  private async buscarBusqueda(id: number): Promise<Busqueda> {
    const busqueda = await this.busquedaRepository.findOne({
      where: { id },
      relations: {
        plataformas: true,
        generos: true,
        caracteristicas: true,
        recomendaciones: { juego: RELACIONES_JUEGO },
      },
      order: { recomendaciones: { orden: 'ASC' } },
    });
    if (!busqueda) {
      throw new NotFoundException(`No se encontró la búsqueda con id ${id}`);
    }
    return busqueda;
  }
}
