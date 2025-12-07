import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type OrderMessageDocument = OrderMessage & Document;

export enum MessageSenderRole {
  BUYER = 'BUYER',
  SELLER = 'SELLER',
  COURIER = 'COURIER',
  SYSTEM = 'SYSTEM',
}

@Schema({ timestamps: true })
export class OrderMessage {
  @Prop({ type: MongooseSchema.Types.ObjectId, auto: true })
  _id!: MongooseSchema.Types.ObjectId;

  @Prop({ required: true, index: true })
  orderId!: string;

  @Prop({ required: true })
  senderId!: string;

  @Prop({ required: true, enum: MessageSenderRole })
  senderRole!: MessageSenderRole;

  @Prop({ required: true })
  content!: string;

  @Prop({ default: false })
  isRead!: boolean;

  @Prop({ type: Date })
  readAt?: Date;

  @Prop({ type: [String], default: [] })
  attachments!: string[];

  @Prop({ type: Object })
  metadata?: Record<string, unknown>;
}

export const OrderMessageSchema = SchemaFactory.createForClass(OrderMessage);

// Index for efficient queries by orderId
OrderMessageSchema.index({ orderId: 1, createdAt: 1 });
