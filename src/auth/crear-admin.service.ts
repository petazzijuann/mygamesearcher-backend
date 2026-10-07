import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { hash } from 'bcryptjs';
import { Repository } from 'typeorm';
import { Rol } from '../usuario/rol.enum';
import { Usuario } from '../usuario/usuario.entity';
import { RONDAS_HASH } from '../usuario/usuario.service';

// Al arrancar la API, si no hay ningún ADMIN, crea uno con ADMIN_EMAIL y ADMIN_CONTRASENA del .env
@Injectable()
export class CrearAdminService implements OnApplicationBootstrap {
  private readonly logger = new Logger('CrearAdmin');

  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
    private readonly config: ConfigService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    if (await this.usuarioRepository.existsBy({ rol: Rol.ADMIN })) {
      return;
    }

    const email = this.config.get<string>('ADMIN_EMAIL')?.trim().toLowerCase();
    const contrasena = this.config.get<string>('ADMIN_CONTRASENA');
    // Un problema con el admin no impide que la API arranque: solo se avisa
    if (!email || !contrasena) {
      this.logger.warn(
        'No hay ningún administrador y faltan ADMIN_EMAIL o ADMIN_CONTRASENA en el .env',
      );
      return;
    }
    if (contrasena.length < 8 || contrasena.length > 72) {
      this.logger.warn(
        'No se creó el administrador: ADMIN_CONTRASENA debe tener entre 8 y 72 caracteres',
      );
      return;
    }

    // Si el email ya está registrado, ese usuario pasa a ser ADMIN
    const existente = await this.usuarioRepository.findOneBy({ email });
    if (existente) {
      await this.usuarioRepository.update(existente.id, { rol: Rol.ADMIN });
      this.logger.log(`Se asignó el rol ADMIN al usuario ${email}`);
      return;
    }

    await this.usuarioRepository.save(
      this.usuarioRepository.create({
        nombre: 'Administrador',
        apellido: 'DGame',
        email,
        contrasenaHash: await hash(contrasena, RONDAS_HASH),
        rol: Rol.ADMIN,
      }),
    );
    this.logger.log(`Se creó el administrador ${email}`);
  }
}
