import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('clasificacion_edad')
export class ClasificacionEdad {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50, unique: true })
  nombre: string;
}
