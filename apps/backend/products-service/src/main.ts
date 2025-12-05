import './instrumentation';

import { NestFactory } from '@nestjs/core';
import { NestExpressApplication, ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { Logger } from 'nestjs-pino';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, new ExpressAdapter(), {
    bufferLogs: true,
  });
  app.useLogger(app.get(Logger));
  app.useGlobalFilters(new HttpExceptionFilter());
  const port = process.env.PRODUCTS_SERVICE_PORT || 3002;
  await app.listen(port);
  const logger = app.get(Logger);
  logger.log(`🚀 Products service running on port ${port}`);
  if (app.flushLogs) {
    app.flushLogs();
  }
}
bootstrap();
