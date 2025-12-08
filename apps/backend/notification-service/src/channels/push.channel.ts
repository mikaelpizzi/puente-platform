import { Injectable, Logger } from '@nestjs/common';
import * as webPush from 'web-push';

export interface PushPayload {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  title: string;
  body: string;
  icon?: string;
  data?: Record<string, unknown>;
}

/**
 * Push Channel
 *
 * Sends Web Push notifications using the web-push library.
 */
@Injectable()
export class PushChannel {
  private readonly logger = new Logger(PushChannel.name);
  private isConfigured = false;

  constructor() {
    this.initVapid();
  }

  private initVapid() {
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    const subject = process.env.VAPID_SUBJECT || 'mailto:admin@puente.com';

    if (!publicKey || !privateKey) {
      this.logger.warn('VAPID keys not configured, push channel disabled');
      return;
    }

    webPush.setVapidDetails(subject, publicKey, privateKey);
    this.isConfigured = true;
    this.logger.log('🔔 Push channel initialized');
  }

  async send(payload: PushPayload): Promise<boolean> {
    if (!this.isConfigured) {
      this.logger.warn('Push channel not configured, skipping');
      return false;
    }

    try {
      const pushSubscription = {
        endpoint: payload.endpoint,
        keys: payload.keys,
      };

      const notificationPayload = JSON.stringify({
        title: payload.title,
        body: payload.body,
        icon: payload.icon || '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        data: payload.data,
      });

      await webPush.sendNotification(pushSubscription, notificationPayload);
      this.logger.debug(`Push notification sent to ${payload.endpoint.substring(0, 50)}...`);
      return true;
    } catch (error) {
      this.logger.error('Failed to send push notification:', error);
      return false;
    }
  }
}
