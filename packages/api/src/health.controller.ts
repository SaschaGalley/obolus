import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from './common/decorators/public.decorator';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  // Ohne @Public() greift der global registrierte JwtAuthGuard (AuthModule)
  // und der Container-Healthcheck bekommt 401 statt 200.
  @Public()
  @Get()
  check() {
    return { status: 'ok' };
  }
}
