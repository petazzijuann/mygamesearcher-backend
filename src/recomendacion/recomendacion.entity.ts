import {
  Check,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Busqueda } from '../busqueda/busqueda.entity';
import { Juego } from '../juego/juego.entity';

// Juego recomendado en una búsqueda (de 1 a 3 por búsqueda, sin repetir juego)
@Entity('recomendacion')
@Unique(['busqueda', 'juego'])
@Check('"orden" BETWEEN 1 AND 3')
@Check('"calificacion" BETWEEN 1 AND 5')
export class Recomendacion {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Busqueda, (busqueda) => busqueda.recomendaciones, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'busqueda_id' })
  busqueda: Busqueda;

  // Si se borra el juego, se borra la recomendación (no se bloquea al administrador)
  @ManyToOne(() => Juego, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'juego_id' })
  juego: Juego;

  @Column({ type: 'smallint' })
  orden: number;

  // Se completan cuando el usuario califica la recomendación
  @Column({ type: 'smallint', nullable: true })
  calificacion: number | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  comentario: string | null;

  @Column({ name: 'fecha_calificacion', type: 'timestamptz', nullable: true })
  fechaCalificacion: Date | null;
}
