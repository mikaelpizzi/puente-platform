import { Module, forwardRef } from '@nestjs/common';
import { EventsListener } from './events.listener';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [forwardRef(() => NotificationsModule)],
  providers: [EventsListener],
  exports: [EventsListener],
})
export class EventsModule {}
