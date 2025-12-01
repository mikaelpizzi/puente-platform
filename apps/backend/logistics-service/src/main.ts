import './instrumentation';

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { Logger } from 'nestjs-pino';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));
  app.useGlobalFilters(new HttpExceptionFilter());
  const port = process.env.LOGISTICS_SERVICE_PORT || 3004;
  await app.listen(port);
  const logger = app.get(Logger);
  logger.log(`🚀 Logistics service running on port ${port}`);
  if (app.flushLogs) {
    app.flushLogs();
  }
}
bootstrap();
