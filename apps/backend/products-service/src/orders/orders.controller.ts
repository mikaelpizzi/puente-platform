import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Headers,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderStatus } from './schemas/order.schema';
import { ServiceAuthGuard } from '../common/guards/service-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@Controller('orders')
@UseGuards(ServiceAuthGuard, RolesGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  /**
   * Creates a new order.
   * The buyerId is extracted from the x-user-id header (set by API Gateway).
   */
  @Post()
  @Roles(Role.BUYER, Role.ADMIN)
  async create(@Body() createOrderDto: CreateOrderDto, @Headers('x-user-id') userId: string) {
    if (!userId) {
      throw new UnauthorizedException('Missing user context (x-user-id)');
    }
    return this.ordersService.create(createOrderDto, userId);
  }

  /**
   * Gets all orders for the current user as a buyer.
   */
  @Get('buyer')
  @Roles(Role.BUYER, Role.ADMIN)
  async findByBuyer(@Headers('x-user-id') userId: string, @Query('status') status?: OrderStatus) {
    if (!userId) {
      throw new UnauthorizedException('Missing user context (x-user-id)');
    }
    return this.ordersService.findByBuyer(userId, status);
  }

  /**
   * Gets all orders for the current user as a seller.
   */
  @Get('seller')
  @Roles(Role.SELLER, Role.ADMIN)
  async findBySeller(@Headers('x-user-id') userId: string, @Query('status') status?: OrderStatus) {
    if (!userId) {
      throw new UnauthorizedException('Missing user context (x-user-id)');
    }
    return this.ordersService.findBySeller(userId, status);
  }

  /**
   * Gets a single order by ID.
   */
  @Get(':id')
  @Roles(Role.BUYER, Role.SELLER, Role.ADMIN)
  async findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  /**
   * Updates the status of an order.
   * Only sellers (who own the order) or admins can update status.
   */
  @Patch(':id/status')
  @Roles(Role.SELLER, Role.ADMIN)
  async updateStatus(@Param('id') id: string, @Body() updateOrderStatusDto: UpdateOrderStatusDto) {
    return this.ordersService.updateStatus(id, updateOrderStatusDto.status);
  }

  /**
   * Cancels an order.
   * Both buyers (their own orders) and sellers can cancel.
   */
  @Patch(':id/cancel')
  @Roles(Role.BUYER, Role.SELLER, Role.ADMIN)
  async cancel(@Param('id') id: string) {
    return this.ordersService.cancel(id);
  }
}
