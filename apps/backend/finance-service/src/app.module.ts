import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { PrismaModule } from './prisma/prisma.module';
import { FinanceModule } from './finance/finance.module';
import { HealthController } from './health/health.controller';
import type { IncomingHttpHeaders, IncomingMessage } from 'http';
import type { ReqId } from 'pino-http';

type TraceableRequest = IncomingMessage & { id?: ReqId };

const extractTraceId = (headers?: IncomingHttpHeaders) => {
  if (!headers) {
    return undefined;
  }

  const traceparentHeader = headers['traceparent'];
  if (typeof traceparentHeader === 'string') {
    const [, traceId] = traceparentHeader.split('-');
    if (traceId) {
      return traceId;
    }
  }

  const b3TraceId = headers['x-b3-traceid'];
  if (typeof b3TraceId === 'string') {
    return b3TraceId;
  }

  return undefined;
};

const extractRequestId = (req: TraceableRequest) => {
  const requestId = req.id;
  if (typeof requestId === 'string') {
    return requestId;
  }

  if (typeof requestId === 'number') {
    return requestId.toString(10);
  }

  const headerValue = req.headers?.['x-request-id'];
  if (typeof headerValue === 'string') {
    return headerValue;
  }

  if (Array.isArray(headerValue)) {
    return headerValue[0];
  }

  return undefined;
};

const shouldSkipAutoLogging = (req: IncomingMessage) => req.url?.includes('/health') ?? false;

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL || 'info',
        transport:
          process.env.NODE_ENV !== 'production'
            ? {
                target: 'pino-pretty',
                options: {
                  translateTime: 'SYS:standard',
                  singleLine: true,
                  colorize: true,
                },
              }
            : undefined,
        autoLogging: {
          ignore: shouldSkipAutoLogging,
        },
        customProps: (req) => ({
          requestId: extractRequestId(req as TraceableRequest),
          traceId: extractTraceId(req.headers),
        }),
      },
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env', '../../.env', '../../../.env'],
    }),
    PrismaModule,
    FinanceModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
