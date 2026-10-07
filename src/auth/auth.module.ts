import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule, JwtModuleOptions, JwtSignOptions } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Usuario } from '../usuario/usuario.entity';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { CrearAdminService } from './crear-admin.service';
import { AutenticacionGuard } from './guards/autenticacion.guard';
import { RolesGuard } from './guards/roles.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([Usuario]),
    // global: JwtService queda disponible para el AutenticacionGuard en toda la app
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService): JwtModuleOptions => {
        const secreto = config.get<string>('JWT_SECRET');
        if (!secreto) {
          // Sin clave no se arranca: evita firmar tokens inseguros
          throw new Error('Falta la variable de entorno JWT_SECRET en el .env');
        }
        return {
          secret: secreto,
          signOptions: {
            // Formato de duración: "8h", "30m", "7d", etc.
            expiresIn: config.get<string>(
              'JWT_EXPIRACION',
              '8h',
            ) as JwtSignOptions['expiresIn'],
          },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    CrearAdminService,
    // Guards globales, en este orden: primero se identifica al usuario y después se revisa su rol
    { provide: APP_GUARD, useClass: AutenticacionGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AuthModule {}
