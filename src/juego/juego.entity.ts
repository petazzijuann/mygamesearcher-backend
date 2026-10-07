import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Caracteristica } from '../caracteristica/caracteristica.entity';
import { ClasificacionEdad } from '../clasificacion-edad/clasificacion-edad.entity';
import { Genero } from '../genero/genero.entity';
import { Plataforma } from '../plataforma/plataforma.entity';

// La unicidad sin distinguir mayúsculas se valida en el service; esta es la segunda barrera
@Entity('juego')
@Unique(['titulo', 'anioLanzamiento'])
export class Juego {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  titulo: string;

  @Column({ name: 'anio_lanzamiento', type: 'int' })
  anioLanzamiento: number;

  @Column({ type: 'text' })
  descripcion: string;

  @Column({ name: 'imagen_url', type: 'varchar', length: 500, nullable: true })
  imagenUrl: string | null;

  @ManyToOne(() => ClasificacionEdad, (clasificacion) => clasificacion.juegos, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'clasificacion_edad_id' })
  clasificacionEdad: ClasificacionEdad;

  @ManyToMany(() => Plataforma, (plataforma) => plataforma.juegos)
  @JoinTable({
    name: 'juego_plataforma',
    joinColumn: { name: 'juego_id' },
    inverseJoinColumn: { name: 'plataforma_id' },
  })
  plataformas: Plataforma[];

  @ManyToMany(() => Genero, (genero) => genero.juegos)
  @JoinTable({
    name: 'juego_genero',
    joinColumn: { name: 'juego_id' },
    inverseJoinColumn: { name: 'genero_id' },
  })
  generos: Genero[];

  @ManyToMany(() => Caracteristica, (caracteristica) => caracteristica.juegos)
  @JoinTable({
    name: 'juego_caracteristica',
    joinColumn: { name: 'juego_id' },
    inverseJoinColumn: { name: 'caracteristica_id' },
  })
  caracteristicas: Caracteristica[];
}
