import {
  CreateDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Caracteristica } from '../caracteristica/caracteristica.entity';
import { Genero } from '../genero/genero.entity';
import { Plataforma } from '../plataforma/plataforma.entity';
import { Recomendacion } from '../recomendacion/recomendacion.entity';
import { Usuario } from '../usuario/usuario.entity';

// Criterios que eligió el usuario al pedir una recomendación
@Entity('busqueda')
export class Busqueda {
  @PrimaryGeneratedColumn()
  id: number;

  // Si se borra el usuario, se borran sus búsquedas
  @ManyToOne(() => Usuario, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;

  @CreateDateColumn({ name: 'fecha_busqueda', type: 'timestamptz' })
  fechaBusqueda: Date;

  // Sin relación inversa en los catálogos: si se borra uno, sale de los criterios (CASCADE)
  @ManyToMany(() => Plataforma)
  @JoinTable({
    name: 'busqueda_plataforma',
    joinColumn: { name: 'busqueda_id' },
    inverseJoinColumn: { name: 'plataforma_id' },
  })
  plataformas: Plataforma[];

  @ManyToMany(() => Genero)
  @JoinTable({
    name: 'busqueda_genero',
    joinColumn: { name: 'busqueda_id' },
    inverseJoinColumn: { name: 'genero_id' },
  })
  generos: Genero[];

  @ManyToMany(() => Caracteristica)
  @JoinTable({
    name: 'busqueda_caracteristica',
    joinColumn: { name: 'busqueda_id' },
    inverseJoinColumn: { name: 'caracteristica_id' },
  })
  caracteristicas: Caracteristica[];

  // cascade insert: un solo save guarda la búsqueda y sus recomendaciones en la misma transacción
  @OneToMany(() => Recomendacion, (recomendacion) => recomendacion.busqueda, {
    cascade: ['insert'],
  })
  recomendaciones: Recomendacion[];
}
