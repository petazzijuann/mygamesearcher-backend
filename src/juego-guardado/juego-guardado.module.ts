import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Juego } from '../juego/juego.entity';
import { Usuario } from '../usuario/usuario.entity';
import { JuegoGuardadoController } from './juego-guardado.controller';
import { JuegoGuardado } from './juego-guardado.entity';
import { JuegoGuardadoService } from './juego-guardado.service';

@Module({
  // Usuario y Juego se registran para validar los ids que llegan en el pedido
  imports: [TypeOrmModule.forFeature([JuegoGuardado, Usuario, Juego])],
  controllers: [JuegoGuardadoController],
  providers: [JuegoGuardadoService],
})
export class JuegoGuardadoModule {}
