import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ApiHideProperty } from '@nestjs/swagger';
import { Juego } from '../juego/juego.entity';

@Entity('clasificacion_edad')
export class ClasificacionEdad {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50, unique: true })
  nombre: string;

  // El RESTRICT está del lado de Juego, que tiene la clave foránea
  // No se devuelve en las respuestas: se oculta en la documentación
  @ApiHideProperty()
  @OneToMany(() => Juego, (juego) => juego.clasificacionEdad)
  juegos: Juego[];
}
