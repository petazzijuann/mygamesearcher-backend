import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Juego } from '../juego/juego.entity';
import { Usuario } from '../usuario/usuario.entity';

// La unicidad sin distinguir mayúsculas se valida en el service; esta es la segunda barrera
@Entity('coleccion')
@Unique(['usuario', 'nombre'])
export class Coleccion {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  nombre: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  descripcion: string | null;

  @CreateDateColumn({ name: 'fecha_creacion', type: 'timestamptz' })
  fechaCreacion: Date;

  // Si se borra el usuario, se borran sus colecciones
  @ManyToOne(() => Usuario, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;

  // Sin relación inversa en Juego: si se borra un juego, sale de las colecciones (CASCADE)
  @ManyToMany(() => Juego)
  @JoinTable({
    name: 'coleccion_juego',
    joinColumn: { name: 'coleccion_id' },
    inverseJoinColumn: { name: 'juego_id' },
  })
  juegos: Juego[];
}
