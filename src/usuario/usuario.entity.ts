import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ApiHideProperty } from '@nestjs/swagger';
import { Plataforma } from '../plataforma/plataforma.entity';
import { Rol } from './rol.enum';

@Entity('usuario')
export class Usuario {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50 })
  nombre: string;

  @Column({ length: 50 })
  apellido: string;

  @Column({ length: 100, unique: true })
  email: string;

  // select: false -> no se trae en ninguna consulta salvo que se pida explícitamente
  // Nunca se devuelve en una respuesta: se oculta también en la documentación
  @ApiHideProperty()
  @Column({ name: 'contrasena_hash', select: false })
  contrasenaHash: string;

  @Column({ type: 'enum', enum: Rol, default: Rol.USUARIO })
  rol: Rol;

  @CreateDateColumn({ name: 'fecha_registro', type: 'timestamptz' })
  fechaRegistro: Date;

  // Plataforma favorita (opcional); si se borra la plataforma, queda en null
  @ManyToOne(() => Plataforma, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'plataforma_id' })
  plataforma: Plataforma | null;
}
