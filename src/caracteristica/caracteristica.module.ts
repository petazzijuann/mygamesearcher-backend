import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CaracteristicaController } from './caracteristica.controller';
import { Caracteristica } from './caracteristica.entity';
import { CaracteristicaService } from './caracteristica.service';

@Module({
  imports: [TypeOrmModule.forFeature([Caracteristica])],
  controllers: [CaracteristicaController],
  providers: [CaracteristicaService],
})
export class CaracteristicaModule {}
