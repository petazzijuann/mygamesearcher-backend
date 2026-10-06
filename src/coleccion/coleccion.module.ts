import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Juego } from '../juego/juego.entity';
import { Usuario } from '../usuario/usuario.entity';
import { ColeccionController } from './coleccion.controller';
import { Coleccion } from './coleccion.entity';
import { ColeccionService } from './coleccion.service';

@Module({
  // Usuario y Juego se registran para validar los ids que llegan en el body
  imports: [TypeOrmModule.forFeature([Coleccion, Usuario, Juego])],
  controllers: [ColeccionController],
  providers: [ColeccionService],
})
export class ColeccionModule {}
