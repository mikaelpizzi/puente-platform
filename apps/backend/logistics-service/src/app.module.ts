import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LogisticsModule } from './logistics/logistics.module';
import { RedisModule } from './redis/redis.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), RedisModule, LogisticsModule],
})
export class AppModule {}
