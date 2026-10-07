import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Busqueda } from '../busqueda/busqueda.entity';
import { Caracteristica } from '../caracteristica/caracteristica.entity';
import { Genero } from '../genero/genero.entity';
import { Juego } from '../juego/juego.entity';
import { Plataforma } from '../plataforma/plataforma.entity';
import { Usuario } from '../usuario/usuario.entity';
import { RecomendacionController } from './recomendacion.controller';
import { Recomendacion } from './recomendacion.entity';
import { RecomendacionService } from './recomendacion.service';

@Module({
  // Recomendacion se guarda en cascada desde Busqueda;
  // el resto se usa para validar los criterios y buscar candidatos
  imports: [
    TypeOrmModule.forFeature([
      Busqueda,
      Recomendacion,
      Juego,
      Usuario,
      Plataforma,
      Genero,
      Caracteristica,
    ]),
  ],
  controllers: [RecomendacionController],
  providers: [RecomendacionService],
})
export class RecomendacionModule {}
