import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';
import { Publico } from './auth/decoradores/publico.decorator';

@ApiTags('Estado')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  // Público: sirve para chequear que la API está viva
  @ApiOperation({ summary: 'Verificar que la API está funcionando (público)' })
  @Publico()
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
