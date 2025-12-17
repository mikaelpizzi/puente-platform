import { Injectable, Logger, Inject } from '@nestjs/common';
import Redis from 'ioredis';

/**
 * Events Service
 * Handles publishing events to Redis for inter-service communication.
 * The notification-service listens on the 'notifications' channel.
 */
@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);
  private readonly NOTIFICATIONS_CHANNEL = 'notifications';

  constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) {}

  /**
   * Publishes an event to the notifications channel.
   * Events are consumed by notification-service to send notifications.
   */
  async publishEvent(type: string, payload: Record<string, unknown>): Promise<number> {
    const message = JSON.stringify({ type, payload });

    try {
      const result = await this.redis.publish(this.NOTIFICATIONS_CHANNEL, message);
      this.logger.log(
        `Published event '${type}' to ${this.NOTIFICATIONS_CHANNEL} (${result} subscribers)`,
      );
      return result;
    } catch (error) {
      this.logger.error(`Failed to publish event '${type}':`, error);
      throw error;
    }
  }

  /**
   * Publishes a payment.received event for notification-service.
   */
  async publishPaymentReceived(
    orderId: string,
    sellerId: string,
    buyerId: string | null,
    totalAmount: number,
  ): Promise<number> {
    return this.publishEvent('payment.received', {
      orderId,
      sellerId,
      buyerId,
      totalAmount,
    });
  }

  /**
   * Publishes an order.created event for notification-service.
   */
  async publishOrderCreated(
    orderId: string,
    sellerId: string,
    buyerId: string | null,
    totalAmount: number,
  ): Promise<number> {
    return this.publishEvent('order.created', {
      orderId,
      sellerId,
      buyerId,
      totalAmount,
    });
  }
}
