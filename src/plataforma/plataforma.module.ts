import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlataformaController } from './plataforma.controller';
import { Plataforma } from './plataforma.entity';
import { PlataformaService } from './plataforma.service';

@Module({
  imports: [TypeOrmModule.forFeature([Plataforma])],
  controllers: [PlataformaController],
  providers: [PlataformaService],
})
export class PlataformaModule {}
