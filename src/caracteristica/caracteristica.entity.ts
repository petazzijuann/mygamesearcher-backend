import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Juego } from '../juego/juego.entity';

@Entity('caracteristica')
export class Caracteristica {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50, unique: true })
  nombre: string;

  // RESTRICT: no se puede borrar una característica que usa algún juego.
  // persistence: false evita que TypeORM borre las filas de juego_caracteristica antes del DELETE
  @ManyToMany(() => Juego, (juego) => juego.caracteristicas, {
    onDelete: 'RESTRICT',
    persistence: false,
  })
  juegos: Juego[];
}
