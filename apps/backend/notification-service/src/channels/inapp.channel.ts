import { Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';

export interface InAppPayload {
  userId: string;
  title: string;
  message: string;
  type: string;
  data?: Record<string, unknown>;
}

/**
 * In-App Channel
 *
 * Publishes notifications to Redis for real-time delivery via WebSocket.
 * The logistics-service gateway will pick these up and deliver to connected clients.
 */
@Injectable()
export class InAppChannel {
  private readonly logger = new Logger(InAppChannel.name);
  private publisher: Redis | null = null;

  constructor() {
    this.initRedis();
  }

  private initRedis() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

    try {
      this.publisher = new Redis(redisUrl);
      this.logger.log('📱 In-app channel initialized');
    } catch (error) {
      this.logger.error('Failed to connect to Redis for in-app channel:', error);
    }
  }

  async send(payload: InAppPayload): Promise<boolean> {
    if (!this.publisher) {
      this.logger.warn('In-app channel not configured, skipping');
      return false;
    }

    try {
      // Publish to user-specific channel
      const channel = `inapp:${payload.userId}`;
      const message = JSON.stringify({
        type: 'notification',
        data: {
          title: payload.title,
          message: payload.message,
          notificationType: payload.type,
          ...payload.data,
          timestamp: new Date().toISOString(),
        },
      });

      await this.publisher.publish(channel, message);
      this.logger.debug(`In-app notification published for user ${payload.userId}`);
      return true;
    } catch (error) {
      this.logger.error('Failed to send in-app notification:', error);
      return false;
    }
  }
}
