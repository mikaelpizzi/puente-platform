import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as Joi from 'joi';
import { createServiceProxy } from './middleware/proxy.middleware';
import { AuthMiddleware } from './middleware/auth.middleware';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
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
        { path: 'products/*path', method: RequestMethod.ALL },
        { path: 'finance/*path', method: RequestMethod.ALL },
        { path: 'logistics/*path', method: RequestMethod.ALL },
      );

    consumer
      .apply(
        createServiceProxy(
          this.configService.get('PRODUCTS_SERVICE_URL') || '',
          this.configService,
        ),
      )
      .forRoutes({ path: 'products/*path', method: RequestMethod.ALL });

    consumer
      .apply(
        createServiceProxy(this.configService.get('FINANCE_SERVICE_URL') || '', this.configService),
      )
      .forRoutes({ path: 'finance/*path', method: RequestMethod.ALL });

    consumer
      .apply(
        createServiceProxy(
          this.configService.get('LOGISTICS_SERVICE_URL') || '',
          this.configService,
        ),
      )
      .forRoutes({ path: 'logistics/*path', method: RequestMethod.ALL });
  }
}
