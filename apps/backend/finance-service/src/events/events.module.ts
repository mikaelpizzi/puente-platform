import { Module } from '@nestjs/common';
import { EventsService } from './events.service';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [RedisModule],
  providers: [EventsService],
  exports: [EventsService],
})
export class EventsModule {}
