import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { NotificationEvent, OrderEventPayload, DeliveryEventPayload } from './events.types';
import { NotificationsService } from '../notifications/notifications.service';

/**
 * Events Listener
 *
 * Listens to Redis Pub/Sub for events from other microservices
 * and dispatches them to the appropriate notification channels.
 */
@Injectable()
export class EventsListener implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EventsListener.name);
  private subscriber: Redis | null = null;

  constructor(private readonly notificationsService: NotificationsService) {}

  async onModuleInit() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

    try {
      this.subscriber = new Redis(redisUrl);

      // Subscribe to notification channel
      await this.subscriber.subscribe('notifications');

      this.subscriber.on('message', (channel, message) => {
        this.handleMessage(channel, message);
      });

      this.logger.log('📡 Connected to Redis and listening for events');
    } catch (error) {
      this.logger.error('Failed to connect to Redis:', error);
    }
  }

  async onModuleDestroy() {
    if (this.subscriber) {
      await this.subscriber.quit();
    }
  }

  private async handleMessage(channel: string, message: string) {
    try {
      const event = JSON.parse(message) as {
        type: NotificationEvent;
        payload: OrderEventPayload | DeliveryEventPayload;
      };

      this.logger.debug(`Received event: ${event.type}`);

      switch (event.type) {
        case NotificationEvent.ORDER_CREATED:
          await this.handleOrderCreated(event.payload as OrderEventPayload);
          break;
        case NotificationEvent.ORDER_SHIPPED:
          await this.handleOrderShipped(event.payload as OrderEventPayload);
          break;
        case NotificationEvent.ORDER_DELIVERED:
          await this.handleOrderDelivered(event.payload as OrderEventPayload);
          break;
        case NotificationEvent.DELIVERY_ASSIGNED:
          await this.handleDeliveryAssigned(event.payload as DeliveryEventPayload);
          break;
        case NotificationEvent.PAYMENT_RECEIVED:
          await this.handlePaymentReceived(event.payload as OrderEventPayload);
          break;
        default:
          this.logger.warn(`Unhandled event type: ${event.type}`);
      }
    } catch (error) {
      this.logger.error('Error processing message:', error);
    }
  }

  private async handleOrderCreated(payload: OrderEventPayload) {
    // Notify seller
    await this.notificationsService.sendMultiChannel({
      userId: payload.sellerId,
      title: '🛒 Nuevo Pedido',
      message: `Has recibido un nuevo pedido por $${payload.totalAmount}`,
      channels: ['email', 'push', 'inapp'],
      data: { orderId: payload.orderId },
    });

    // Notify buyer
    await this.notificationsService.sendMultiChannel({
      userId: payload.buyerId,
      title: '✅ Pedido Confirmado',
      message: 'Tu pedido ha sido recibido y está siendo procesado',
      channels: ['email', 'inapp'],
      data: { orderId: payload.orderId },
    });
  }

  private async handleOrderShipped(payload: OrderEventPayload) {
    await this.notificationsService.sendMultiChannel({
      userId: payload.buyerId,
      title: '📦 Pedido Enviado',
      message: 'Tu pedido está en camino',
      channels: ['push', 'inapp'],
      data: { orderId: payload.orderId },
    });
  }

  private async handleOrderDelivered(payload: OrderEventPayload) {
    await this.notificationsService.sendMultiChannel({
      userId: payload.buyerId,
      title: '🎉 Pedido Entregado',
      message: 'Tu pedido ha sido entregado. ¡Gracias por tu compra!',
      channels: ['email', 'push', 'inapp'],
      data: { orderId: payload.orderId },
    });
  }

  private async handleDeliveryAssigned(payload: DeliveryEventPayload) {
    // Notify courier
    await this.notificationsService.sendMultiChannel({
      userId: payload.courierId,
      title: '🚴 Nueva Entrega Asignada',
      message: 'Se te ha asignado una nueva entrega',
      channels: ['push', 'inapp'],
      data: { orderId: payload.orderId },
    });

    // Notify buyer
    await this.notificationsService.sendMultiChannel({
      userId: payload.buyerId,
      title: '🚴 Repartidor Asignado',
      message: 'Un repartidor ha sido asignado a tu pedido',
      channels: ['push', 'inapp'],
      data: { orderId: payload.orderId },
    });
  }

  private async handlePaymentReceived(payload: OrderEventPayload) {
    await this.notificationsService.sendMultiChannel({
      userId: payload.sellerId,
      title: '💰 Pago Recibido',
      message: `Has recibido un pago de $${payload.totalAmount}`,
      channels: ['email', 'inapp'],
      data: { orderId: payload.orderId },
    });
  }
}
