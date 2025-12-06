import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import * as Joi from 'joi';
import { createServiceProxy } from './middleware/proxy.middleware';
import { AuthMiddleware } from './middleware/auth.middleware';
import { SanityCheckMiddleware } from './middleware/sanity-check.middleware';
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
                  colorize: true,
                  singleLine: true,
                  translateTime: 'SYS:standard',
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
      validationSchema: Joi.object({
        API_GATEWAY_PORT: Joi.number().default(3000),
        AUTH_JWT_ACCESS_SECRET: Joi.string().required(),
        AUTH_SERVICE_URL: Joi.string().required(),
        PRODUCTS_SERVICE_URL: Joi.string().required(),
        FINANCE_SERVICE_URL: Joi.string().required(),
        LOGISTICS_SERVICE_URL: Joi.string().required(),
        GATEWAY_SHARED_SECRET: Joi.string().default('dev-secret-key'),
      }),
    }),
  ],
  controllers: [HealthController],
})
export class AppModule {
  constructor(private configService: ConfigService) {}

  configure(consumer: MiddlewareConsumer) {
    // Global sanity checks first
    consumer.apply(SanityCheckMiddleware).forRoutes('*');

    // Public Routes (Auth Service)
    consumer
      .apply(
        createServiceProxy(this.configService.get('AUTH_SERVICE_URL') || '', this.configService),
      )
      .forRoutes({ path: 'auth/*path', method: RequestMethod.ALL });

    // Protected Routes (Products, Finance, Logistics)
    // Apply AuthMiddleware BEFORE ProxyMiddleware
    consumer
      .apply(AuthMiddleware)
      .forRoutes(
        { path: 'products', method: RequestMethod.ALL },
        { path: 'products/', method: RequestMethod.ALL },
        { path: 'products/*path', method: RequestMethod.ALL },
        { path: 'finance', method: RequestMethod.ALL },
        { path: 'finance/', method: RequestMethod.ALL },
        { path: 'finance/*path', method: RequestMethod.ALL },
        { path: 'logistics', method: RequestMethod.ALL },
        { path: 'logistics/', method: RequestMethod.ALL },
        { path: 'logistics/*path', method: RequestMethod.ALL },
      );

    consumer
      .apply(
        createServiceProxy(
          this.configService.get('PRODUCTS_SERVICE_URL') || '',
          this.configService,
        ),
      )
      .forRoutes(
        { path: 'products', method: RequestMethod.ALL },
        { path: 'products/', method: RequestMethod.ALL },
        { path: 'products/*path', method: RequestMethod.ALL },
        { path: 'tags', method: RequestMethod.ALL },
        { path: 'tags/', method: RequestMethod.ALL },
        { path: 'tags/*path', method: RequestMethod.ALL },
      );

    consumer
      .apply(
        createServiceProxy(this.configService.get('FINANCE_SERVICE_URL') || '', this.configService),
      )
      .forRoutes(
        { path: 'finance', method: RequestMethod.ALL },
        { path: 'finance/', method: RequestMethod.ALL },
        { path: 'finance/*path', method: RequestMethod.ALL },
      );

    consumer
      .apply(
        createServiceProxy(
          this.configService.get('LOGISTICS_SERVICE_URL') || '',
          this.configService,
        ),
      )
      .forRoutes(
        { path: 'logistics', method: RequestMethod.ALL },
        { path: 'logistics/', method: RequestMethod.ALL },
        { path: 'logistics/*path', method: RequestMethod.ALL },
      );
  }
}
