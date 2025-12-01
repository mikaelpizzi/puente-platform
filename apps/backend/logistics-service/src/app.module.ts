import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { LogisticsModule } from './logistics/logistics.module';
import { DeliveryModule } from './delivery/delivery.module';
import { RedisModule } from './redis/redis.module';
import { HealthController } from './health/health.controller';
import { MetricsModule } from './metrics/metrics.module';
import type { IncomingHttpHeaders } from 'http';

type RequestWithMeta = {
  id?: string;
  url?: string;
  headers?: IncomingHttpHeaders;
};

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

const extractRequestId = (req: RequestWithMeta) => req?.id;

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
          ignore: (req: RequestWithMeta) => req.url?.includes('/health') ?? false,
        },
        customProps: (req: RequestWithMeta) => ({
          requestId: extractRequestId(req),
          traceId: extractTraceId(req.headers),
        }),
      },
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env', '../../.env', '../../../.env'],
    }),
    RedisModule,
    LogisticsModule,
    DeliveryModule,
    MetricsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
