import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type OrderDocument = HydratedDocument<Order>;

export enum OrderStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

@Schema()
export class OrderItem {
  @Prop({ required: true })
  productId!: string;

  @Prop({ required: true })
  name!: string;

  @Prop({ required: true, min: 1 })
  quantity!: number;

  @Prop({ required: true, min: 0 })
  price!: number;
}

export const OrderItemSchema = SchemaFactory.createForClass(OrderItem);

@Schema({ timestamps: true })
export class Order {
  @Prop({ required: true })
  buyerId!: string; // Reference to user in auth-service

  @Prop({ required: true })
  sellerId!: string; // Reference to user in auth-service

  @Prop({
    type: String,
    enum: Object.values(OrderStatus),
    default: OrderStatus.PENDING,
  })
  status!: OrderStatus;

  @Prop({ type: [OrderItemSchema], required: true })
  items!: OrderItem[];

  @Prop({ required: true, min: 0 })
  total!: number;

  @Prop({ type: Object })
  shippingAddress?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };

  @Prop()
  notes?: string;

  @Prop()
  courierId?: string; // Reference to courier user in auth-service

  @Prop({ type: Object })
  proofOfDelivery?: {
    photoUrl?: string; // Cloudinary URL of delivery photo
    signatureUrl?: string; // Cloudinary URL of signature image
    capturedAt?: Date; // When POD was captured
    capturedBy?: string; // Courier ID who captured POD
    notes?: string; // Optional delivery notes
    latitude?: number; // GPS lat at delivery
    longitude?: number; // GPS lon at delivery
  };

  @Prop()
  deliveredAt?: Date;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
