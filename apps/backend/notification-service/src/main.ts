import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('NotificationService');

  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors();

  const port = process.env.NOTIFICATION_SERVICE_PORT || 3006;
  await app.listen(port);

  logger.log(`🔔 Notification Service running on port ${port}`);
}

bootstrap();
