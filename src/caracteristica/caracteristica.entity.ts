import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('caracteristica')
export class Caracteristica {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50, unique: true })
  nombre: string;
}
