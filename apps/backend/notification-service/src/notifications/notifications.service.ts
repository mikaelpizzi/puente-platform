import { Injectable, Logger } from '@nestjs/common';
import { EmailChannel } from '../channels/email.channel';
import { PushChannel } from '../channels/push.channel';
import { InAppChannel } from '../channels/inapp.channel';

export type NotificationChannel = 'email' | 'push' | 'inapp';

export interface MultiChannelNotification {
  userId: string;
  title: string;
  message: string;
  channels: NotificationChannel[];
  data?: Record<string, unknown>;
  email?: string; // User email for email channel
  pushSubscription?: {
    // Push subscription for push channel
    endpoint: string;
    keys: { p256dh: string; auth: string };
  };
}

/**
 * Notifications Service
 *
 * Orchestrates sending notifications across multiple channels.
 */
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly emailChannel: EmailChannel,
    private readonly pushChannel: PushChannel,
    private readonly inAppChannel: InAppChannel,
  ) {}

  /**
   * Send notification to multiple channels.
   */
  async sendMultiChannel(notification: MultiChannelNotification): Promise<{
    email: boolean;
    push: boolean;
    inapp: boolean;
  }> {
    const results = {
      email: false,
      push: false,
      inapp: false,
    };

    // Send to each requested channel
    const promises: Promise<void>[] = [];

    if (notification.channels.includes('email') && notification.email) {
      promises.push(
        this.emailChannel
          .send({
            to: notification.email,
            subject: notification.title,
            html: EmailChannel.template(
              notification.title,
              notification.message,
              notification.data?.actionUrl as string,
              notification.data?.actionText as string,
            ),
          })
          .then((success) => {
            results.email = success;
          }),
      );
    }

    if (notification.channels.includes('push') && notification.pushSubscription) {
      promises.push(
        this.pushChannel
          .send({
            endpoint: notification.pushSubscription.endpoint,
            keys: notification.pushSubscription.keys,
            title: notification.title,
            body: notification.message,
            data: notification.data,
          })
          .then((success) => {
            results.push = success;
          }),
      );
    }

    if (notification.channels.includes('inapp')) {
      promises.push(
        this.inAppChannel
          .send({
            userId: notification.userId,
            title: notification.title,
            message: notification.message,
            type: (notification.data?.type as string) || 'general',
            data: notification.data,
          })
          .then((success) => {
            results.inapp = success;
          }),
      );
    }

    await Promise.allSettled(promises);

    this.logger.log(
      `Notification sent to ${notification.userId}: email=${results.email}, push=${results.push}, inapp=${results.inapp}`,
    );

    return results;
  }

  /**
   * Send notification to a single channel.
   */
  async sendToChannel(
    channel: NotificationChannel,
    notification: MultiChannelNotification,
  ): Promise<boolean> {
    const single: MultiChannelNotification = {
      ...notification,
      channels: [channel],
    };
    const results = await this.sendMultiChannel(single);
    return results[channel];
  }
}
