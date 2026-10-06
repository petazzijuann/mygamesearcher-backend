import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('genero')
export class Genero {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50, unique: true })
  nombre: string;
}
