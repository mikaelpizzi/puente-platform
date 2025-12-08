import { Module, forwardRef } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { ChannelsModule } from '../channels/channels.module';

@Module({
  imports: [ChannelsModule],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
