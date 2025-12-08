import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

/**
 * Setup Swagger documentation for Finance Service
 */
export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('Puente Finance Service')
    .setDescription('Financial services: payments, ledger, escrow, disputes')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Payments')
    .addTag('Ledger')
    .addTag('Escrow')
    .addTag('Disputes')
    .addTag('Commissions')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });
}
