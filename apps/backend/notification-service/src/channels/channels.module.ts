import { Module } from '@nestjs/common';
import { EmailChannel } from './email.channel';
import { PushChannel } from './push.channel';
import { InAppChannel } from './inapp.channel';

@Module({
  providers: [EmailChannel, PushChannel, InAppChannel],
  exports: [EmailChannel, PushChannel, InAppChannel],
})
export class ChannelsModule {}
