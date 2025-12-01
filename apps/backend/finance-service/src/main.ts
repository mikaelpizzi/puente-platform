import './instrumentation';

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { Logger } from 'nestjs-pino';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      whitelist: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  const port = process.env.FINANCE_SERVICE_PORT || 3003;
  await app.listen(port);
  const logger = app.get(Logger);
  logger.log(`🚀 Finance service running on port ${port}`);
  if (app.flushLogs) {
    app.flushLogs();
  }
}
bootstrap();
