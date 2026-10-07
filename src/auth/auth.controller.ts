import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiErrores } from '../comun/documentacion';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { Publico } from './decoradores/publico.decorator';
import { LoginDto } from './dto/login.dto';

@ApiTags('Autenticación')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // 200 y no 201: iniciar sesión no crea ningún recurso
  @ApiOperation({
    summary:
      'Iniciar sesión: devuelve el token JWT y los datos del usuario (público)',
  })
  @Publico()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiErrores(400, 401)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }
}
