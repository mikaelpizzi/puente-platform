import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

/**
 * Setup Swagger documentation for Notification Service
 */
export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('Puente Notification Service')
    .setDescription('Multi-channel notifications: email, push, in-app')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Notifications')
    .addTag('Channels')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });
}
