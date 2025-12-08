import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

/**
 * Setup Swagger documentation for Products Service
 */
export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('Puente Products Service')
    .setDescription('Product catalog and inventory management')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Products')
    .addTag('Inventory')
    .addTag('Search')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });
}
