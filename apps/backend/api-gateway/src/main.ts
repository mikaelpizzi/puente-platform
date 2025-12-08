import './otel-init';
import './instrumentation';

import { NestFactory } from '@nestjs/core';
import { NestExpressApplication, ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';
import { setupSwagger } from './swagger';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, new ExpressAdapter(), {
    bodyParser: false,
    bufferLogs: true,
  });
  app.useLogger(app.get(Logger));

  const configService = app.get(ConfigService);
  const port = configService.get('API_GATEWAY_PORT') || 3000;

  // 2. CORRECCIÓN NAVEGADOR: Habilitamos CORS explícito
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: 'Content-Type, Accept, Authorization',
  });

  // Setup Swagger documentation
  setupSwagger(app, {
    title: 'Puente API Gateway',
    description: 'API Gateway for Puente P2P Commerce Platform',
    tags: ['Auth', 'Products', 'Orders', 'Logistics', 'Finance'],
  });

  await app.listen(port, '0.0.0.0');
  const logger = app.get(Logger);
  logger.log(`🚀 API Gateway running on port ${port}`);
  logger.log(`📚 Swagger docs available at http://localhost:${port}/docs`);
  if (app.flushLogs) {
    app.flushLogs();
  }
}
bootstrap();
