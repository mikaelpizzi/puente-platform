import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  getHealth() {
    return {
      status: 'ok',
      service: 'logistics-service',
      timestamp: new Date().toISOString(),
    };
  }
}
