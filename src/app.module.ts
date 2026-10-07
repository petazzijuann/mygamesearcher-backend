import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GeneroModule } from './genero/genero.module';
import { PlataformaModule } from './plataforma/plataforma.module';
import { CaracteristicaModule } from './caracteristica/caracteristica.module';
import { ClasificacionEdadModule } from './clasificacion-edad/clasificacion-edad.module';
import { JuegoModule } from './juego/juego.module';
import { UsuarioModule } from './usuario/usuario.module';
import { ColeccionModule } from './coleccion/coleccion.module';
import { JuegoGuardadoModule } from './juego-guardado/juego-guardado.module';
import { RecomendacionModule } from './recomendacion/recomendacion.module';

@Module({
  imports: [
    // Carga el .env y deja ConfigService disponible en todos los modulos
    ConfigModule.forRoot({ isGlobal: true }),
    // Async para leer las variables recien cuando el .env ya esta cargado
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST'),
        port: Number(config.get<string>('DB_PORT', '5432')),
        username: config.get<string>('DB_USER'),
        password: config.get<string>('DB_PASS'),
        database: config.get<string>('DB_NAME'),
        // Supabase exige SSL; en local se usa sin SSL
        ssl:
          config.get<string>('DB_SSL') === 'true'
            ? { rejectUnauthorized: false }
            : false,
        autoLoadEntities: true,
        // Solo en desarrollo: en produccion no se modifica el esquema automaticamente
        synchronize: config.get<string>('NODE_ENV') !== 'production',
      }),
    }),
    GeneroModule,
    PlataformaModule,
    CaracteristicaModule,
    ClasificacionEdadModule,
    JuegoModule,
    UsuarioModule,
    ColeccionModule,
    JuegoGuardadoModule,
    RecomendacionModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
