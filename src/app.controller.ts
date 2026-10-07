import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { Publico } from './auth/decoradores/publico.decorator';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  // Público: sirve para chequear que la API está viva
  @Publico()
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
