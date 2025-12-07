import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  OrderMessage,
  OrderMessageDocument,
  MessageSenderRole,
} from './schemas/order-message.schema';
import { CreateMessageDto } from './dto/create-message.dto';
import { Order, OrderDocument } from '../orders/schemas/order.schema';

@Injectable()
export class MessagesService {
  private readonly logger = new Logger(MessagesService.name);

  constructor(
    @InjectModel(OrderMessage.name) private messageModel: Model<OrderMessageDocument>,
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
  ) {}

  /**
   * Creates a new message for an order.
   * Validates that the sender is a participant in the order.
   */
  async create(
    orderId: string,
    createMessageDto: CreateMessageDto,
    senderId: string,
    userRole: string,
  ): Promise<OrderMessage> {
    // Verify order exists and user is a participant
    const order = await this.orderModel.findById(orderId).exec();
    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    // Check if user is a participant
    const isParticipant = this.isOrderParticipant(order, senderId, userRole);
    if (!isParticipant) {
      throw new ForbiddenException('You are not a participant in this order');
    }

    // Determine sender role
    const senderRole = createMessageDto.senderRole || this.mapUserRole(userRole);

    const message = new this.messageModel({
      orderId,
      senderId,
      senderRole,
      content: createMessageDto.content,
      attachments: createMessageDto.attachments || [],
      metadata: createMessageDto.metadata,
    });

    const saved = await message.save();
    this.logger.log(`Message created for order ${orderId} by ${senderRole}`);

    return saved;
  }

  /**
   * Gets all messages for an order.
   * Only participants can view messages.
   */
  async findByOrder(orderId: string, userId: string, userRole: string): Promise<OrderMessage[]> {
    // Verify order exists and user is a participant
    const order = await this.orderModel.findById(orderId).exec();
    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    // Check if user is a participant
    const isParticipant = this.isOrderParticipant(order, userId, userRole);
    if (!isParticipant) {
      throw new ForbiddenException('You are not a participant in this order');
    }

    return this.messageModel.find({ orderId }).sort({ createdAt: 1 }).exec();
  }

  /**
   * Marks all messages in an order as read for a specific user.
   */
  async markAsRead(orderId: string, userId: string, userRole: string): Promise<number> {
    // Verify order exists and user is a participant
    const order = await this.orderModel.findById(orderId).exec();
    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    const isParticipant = this.isOrderParticipant(order, userId, userRole);
    if (!isParticipant) {
      throw new ForbiddenException('You are not a participant in this order');
    }

    // Mark messages from other users as read
    const result = await this.messageModel.updateMany(
      {
        orderId,
        senderId: { $ne: userId },
        isRead: false,
      },
      {
        $set: {
          isRead: true,
          readAt: new Date(),
        },
      },
    );

    this.logger.log(`Marked ${result.modifiedCount} messages as read for order ${orderId}`);
    return result.modifiedCount;
  }

  /**
   * Gets unread message count for an order.
   */
  async getUnreadCount(orderId: string, userId: string): Promise<number> {
    return this.messageModel.countDocuments({
      orderId,
      senderId: { $ne: userId },
      isRead: false,
    });
  }

  /**
   * Creates a system message (for order status updates, etc.)
   */
  async createSystemMessage(orderId: string, content: string): Promise<OrderMessage> {
    const message = new this.messageModel({
      orderId,
      senderId: 'system',
      senderRole: MessageSenderRole.SYSTEM,
      content,
    });

    return message.save();
  }

  /**
   * Checks if a user is a participant in an order.
   */
  private isOrderParticipant(order: OrderDocument, userId: string, userRole: string): boolean {
    // ADMIN can access any order
    if (userRole === 'ADMIN') {
      return true;
    }

    // Check if user is buyer, seller, or courier
    return (
      order.buyerId === userId ||
      order.sellerId === userId ||
      (order as unknown as { courierId?: string }).courierId === userId
    );
  }

  /**
   * Maps user role to message sender role.
   */
  private mapUserRole(userRole: string): MessageSenderRole {
    switch (userRole.toUpperCase()) {
      case 'BUYER':
        return MessageSenderRole.BUYER;
      case 'SELLER':
        return MessageSenderRole.SELLER;
      case 'COURIER':
        return MessageSenderRole.COURIER;
      default:
        return MessageSenderRole.SYSTEM;
    }
  }
}
