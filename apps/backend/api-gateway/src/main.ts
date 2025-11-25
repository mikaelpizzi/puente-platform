import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });

  const configService = app.get(ConfigService);
  const port = configService.get('API_GATEWAY_PORT') || 3000;

  // 2. CORRECCIÓN NAVEGADOR: Habilitamos CORS explícito
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: 'Content-Type, Accept, Authorization',
  });

  await app.listen(port, '0.0.0.0');

  console.log(`🚀 API Gateway running on port ${port}`);
}
bootstrap();
