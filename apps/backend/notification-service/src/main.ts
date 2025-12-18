import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { setupSwagger } from './swagger';

async function bootstrap() {
  const logger = new Logger('NotificationService');

  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors();

  // Setup Swagger documentation
  setupSwagger(app);

  const port = process.env.NOTIFICATION_SERVICE_PORT || 3006;
  await app.listen(port, '0.0.0.0');

  logger.log(`🔔 Notification Service running on port ${port}`);
  logger.log(`📚 Swagger docs at http://localhost:${port}/docs`);
}

bootstrap();
