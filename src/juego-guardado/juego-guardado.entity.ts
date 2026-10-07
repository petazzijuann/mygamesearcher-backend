import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Juego } from '../juego/juego.entity';
import { Usuario } from '../usuario/usuario.entity';
import { EstadoJuego } from './estado-juego.enum';

// Biblioteca personal: un juego aparece una sola vez por usuario (PK compuesta)
@Entity('juego_guardado')
export class JuegoGuardado {
  @PrimaryColumn({ name: 'usuario_id' })
  usuarioId: number;

  @PrimaryColumn({ name: 'juego_id' })
  juegoId: number;

  // Si se borra el usuario o el juego, se borra la fila de la biblioteca
  @ManyToOne(() => Usuario, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;

  @ManyToOne(() => Juego, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'juego_id' })
  juego: Juego;

  @Column({ type: 'enum', enum: EstadoJuego })
  estado: EstadoJuego;

  // Fecha del último cambio de estado (la pone la base al guardar y al actualizar)
  @UpdateDateColumn({ type: 'timestamptz' })
  fecha: Date;
}
