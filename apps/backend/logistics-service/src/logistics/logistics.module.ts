import { Module } from '@nestjs/common';
import { LogisticsService } from './logistics.service';
import { LogisticsController } from './logistics.controller';
import { LogisticsGateway } from './logistics.gateway';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [RedisModule],
  controllers: [LogisticsController],
  providers: [LogisticsService, LogisticsGateway],
  exports: [LogisticsService],
})
export class LogisticsModule {}
