import { Module } from '@nestjs/common';
import { EventsModule } from './events/events.module';
import { ChannelsModule } from './channels/channels.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [EventsModule, ChannelsModule, NotificationsModule],
})
export class AppModule {}
