import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('plataforma')
export class Plataforma {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50, unique: true })
  nombre: string;
}
