import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Headers,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { ServiceAuthGuard } from '../common/guards/service-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@Controller('orders/:orderId/messages')
@UseGuards(ServiceAuthGuard, RolesGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  /**
   * Send a message in an order thread.
   * Only participants (buyer, seller, courier) can send messages.
   */
  @Post()
  @Roles(Role.BUYER, Role.SELLER, Role.COURIER, Role.ADMIN)
  async create(
    @Param('orderId') orderId: string,
    @Body() createMessageDto: CreateMessageDto,
    @Headers('x-user-id') userId: string,
    @Headers('x-user-role') userRole: string,
  ) {
    if (!userId) {
      throw new ForbiddenException('User ID required');
    }
    return this.messagesService.create(orderId, createMessageDto, userId, userRole);
  }

  /**
   * Get all messages for an order.
   * Only participants can view messages.
   */
  @Get()
  @Roles(Role.BUYER, Role.SELLER, Role.COURIER, Role.ADMIN)
  async findByOrder(
    @Param('orderId') orderId: string,
    @Headers('x-user-id') userId: string,
    @Headers('x-user-role') userRole: string,
  ) {
    if (!userId) {
      throw new ForbiddenException('User ID required');
    }
    return this.messagesService.findByOrder(orderId, userId, userRole);
  }

  /**
   * Mark all messages in an order as read.
   */
  @Patch('read')
  @Roles(Role.BUYER, Role.SELLER, Role.COURIER, Role.ADMIN)
  async markAsRead(
    @Param('orderId') orderId: string,
    @Headers('x-user-id') userId: string,
    @Headers('x-user-role') userRole: string,
  ) {
    if (!userId) {
      throw new ForbiddenException('User ID required');
    }
    const count = await this.messagesService.markAsRead(orderId, userId, userRole);
    return { markedAsRead: count };
  }

  /**
   * Get unread message count for an order.
   */
  @Get('unread-count')
  @Roles(Role.BUYER, Role.SELLER, Role.COURIER, Role.ADMIN)
  async getUnreadCount(@Param('orderId') orderId: string, @Headers('x-user-id') userId: string) {
    if (!userId) {
      throw new ForbiddenException('User ID required');
    }
    const count = await this.messagesService.getUnreadCount(orderId, userId);
    return { unreadCount: count };
  }
}
