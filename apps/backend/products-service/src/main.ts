import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3002); // Running on port 3002 to avoid conflict with auth-service (3000?) or gateway
}
bootstrap();
