import { Module } from '@nestjs/common';
import { LogisticsService } from './logistics.service';
import { LogisticsController } from './logistics.controller';
import { LogisticsGateway } from './logistics.gateway';
import { RedisModule } from '../redis/redis.module';
import { MetricsModule } from '../metrics/metrics.module';

@Module({
  imports: [RedisModule, MetricsModule],
  controllers: [LogisticsController],
  providers: [LogisticsService, LogisticsGateway],
  exports: [LogisticsService],
})
export class LogisticsModule {}
