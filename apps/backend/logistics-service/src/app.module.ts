import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LogisticsModule } from './logistics/logistics.module';
import { DeliveryModule } from './delivery/delivery.module';
import { RedisModule } from './redis/redis.module';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env', '../../.env', '../../../.env'],
    }),
    RedisModule,
    LogisticsModule,
    DeliveryModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
