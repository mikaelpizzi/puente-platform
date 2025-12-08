/**
 * Event types emitted by microservices.
 * notification-service listens for these to dispatch notifications.
 */
export enum NotificationEvent {
  // Order events
  ORDER_CREATED = 'order.created',
  ORDER_ACCEPTED = 'order.accepted',
  ORDER_SHIPPED = 'order.shipped',
  ORDER_DELIVERED = 'order.delivered',
  ORDER_CANCELLED = 'order.cancelled',

  // Payment events
  PAYMENT_RECEIVED = 'payment.received',
  PAYMENT_FAILED = 'payment.failed',
  PAYMENT_REFUNDED = 'payment.refunded',

  // Delivery events
  DELIVERY_ASSIGNED = 'delivery.assigned',
  DELIVERY_PICKED_UP = 'delivery.picked_up',
  DELIVERY_COMPLETED = 'delivery.completed',

  // User events
  USER_REGISTERED = 'user.registered',
  USER_VERIFIED = 'user.verified',
  PASSWORD_RESET = 'password.reset',

  // Review events
  REVIEW_RECEIVED = 'review.received',

  // Message events
  MESSAGE_RECEIVED = 'message.received',
}

/**
 * Base payload for all events.
 */
export interface BaseEventPayload {
  eventId: string;
  timestamp: Date;
  userId: string;
  metadata?: Record<string, unknown>;
}

/**
 * Order event payload.
 */
export interface OrderEventPayload extends BaseEventPayload {
  orderId: string;
  buyerId: string;
  sellerId: string;
  courierId?: string;
  totalAmount: number;
  items?: { productId: string; title: string; quantity: number }[];
}

/**
 * Delivery event payload.
 */
export interface DeliveryEventPayload extends BaseEventPayload {
  orderId: string;
  courierId: string;
  buyerId: string;
  estimatedDelivery?: Date;
}

/**
 * Payment event payload.
 */
export interface PaymentEventPayload extends BaseEventPayload {
  orderId: string;
  amount: number;
  currency: string;
  method: string;
}
