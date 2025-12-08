import { Module } from '@nestjs/common';
import { ThrottlerModule as NestThrottlerModule, ThrottlerModuleOptions } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { CustomThrottlerGuard } from './throttler.guard';
import { ThrottlerController } from './throttler.controller';

/**
 * Throttler Module
 *
 * Rate limiting configuration:
 * - 100 requests per minute (default)
 * - Configurable via env vars
 */
@Module({
  imports: [
    NestThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000, // 1 second
        limit: 10, // 10 requests per second
      },
      {
        name: 'medium',
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
      {
        name: 'long',
        ttl: 3600000, // 1 hour
        limit: 1000, // 1000 requests per hour
      },
    ]),
  ],
  controllers: [ThrottlerController],
  providers: [
    CustomThrottlerGuard,
    {
      provide: APP_GUARD,
      useClass: CustomThrottlerGuard,
    },
  ],
  exports: [CustomThrottlerGuard],
})
export class ThrottlerModule {}
