import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

interface SwaggerOptions {
  title: string;
  description: string;
  version?: string;
  path?: string;
  tags?: string[];
}

/**
 * Setup Swagger documentation for a NestJS application.
 *
 * @param app - NestJS application instance
 * @param options - Swagger configuration
 */
export function setupSwagger(app: INestApplication, options: SwaggerOptions): void {
  const { title, description, version = '1.0', path = 'docs', tags = [] } = options;

  const builder = new DocumentBuilder()
    .setTitle(title)
    .setDescription(description)
    .setVersion(version)
    .addBearerAuth()
    .addTag('Puente API');

  // Add custom tags
  tags.forEach((tag) => builder.addTag(tag));

  const config = builder.build();
  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup(path, app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
    customSiteTitle: `${title} - API Docs`,
  });
}
