import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Plataforma } from '../plataforma/plataforma.entity';
import { UsuarioController } from './usuario.controller';
import { Usuario } from './usuario.entity';
import { UsuarioService } from './usuario.service';

@Module({
  // Plataforma se registra para validar la plataforma favorita del body
  imports: [TypeOrmModule.forFeature([Usuario, Plataforma])],
  controllers: [UsuarioController],
  providers: [UsuarioService],
})
export class UsuarioModule {}
