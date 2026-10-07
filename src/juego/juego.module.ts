import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Caracteristica } from '../caracteristica/caracteristica.entity';
import { ClasificacionEdad } from '../clasificacion-edad/clasificacion-edad.entity';
import { Genero } from '../genero/genero.entity';
import { Plataforma } from '../plataforma/plataforma.entity';
import { JuegoController } from './juego.controller';
import { Juego } from './juego.entity';
import { JuegoService } from './juego.service';

@Module({
  // Los catálogos se registran para validar los ids que llegan en el body
  imports: [
    TypeOrmModule.forFeature([
      Juego,
      ClasificacionEdad,
      Plataforma,
      Genero,
      Caracteristica,
    ]),
  ],
  controllers: [JuegoController],
  providers: [JuegoService],
})
export class JuegoModule {}
