import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

/**
 * Setup Swagger documentation for Logistics Service
 */
export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('Puente Logistics Service')
    .setDescription('Delivery, routing, and order tracking')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Deliveries')
    .addTag('Tracking')
    .addTag('Routes')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });
}
