import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClasificacionEdadController } from './clasificacion-edad.controller';
import { ClasificacionEdad } from './clasificacion-edad.entity';
import { ClasificacionEdadService } from './clasificacion-edad.service';

@Module({
  imports: [TypeOrmModule.forFeature([ClasificacionEdad])],
  controllers: [ClasificacionEdadController],
  providers: [ClasificacionEdadService],
})
export class ClasificacionEdadModule {}
