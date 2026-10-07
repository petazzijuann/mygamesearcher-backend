import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ApiHideProperty } from '@nestjs/swagger';
import { Juego } from '../juego/juego.entity';

@Entity('genero')
export class Genero {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50, unique: true })
  nombre: string;

  // RESTRICT: no se puede borrar un género que usa algún juego.
  // persistence: false evita que TypeORM borre las filas de juego_genero antes del DELETE
  // No se devuelve en las respuestas: se oculta en la documentación
  @ApiHideProperty()
  @ManyToMany(() => Juego, (juego) => juego.generos, {
    onDelete: 'RESTRICT',
    persistence: false,
  })
  juegos: Juego[];
}
