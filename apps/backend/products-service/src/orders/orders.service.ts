import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order, OrderDocument, OrderStatus } from './schemas/order.schema';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
  constructor(@InjectModel(Order.name) private orderModel: Model<OrderDocument>) {}

  /**
   * Creates a new order.
   * @param createOrderDto - The order data.
   * @param buyerId - The buyer's user ID.
   * @returns The created order.
   */
  async create(createOrderDto: CreateOrderDto, buyerId: string): Promise<Order> {
    const order = new this.orderModel({
      ...createOrderDto,
      buyerId,
      status: OrderStatus.PENDING,
    });
    return order.save();
  }

  /**
   * Finds all orders where the user is the buyer.
   * @param buyerId - The buyer's user ID.
   * @param status - Optional status filter.
   * @returns List of orders.
   */
  async findByBuyer(buyerId: string, status?: OrderStatus): Promise<Order[]> {
    const query: Record<string, unknown> = { buyerId };
    if (status) {
      query.status = status;
    }
    return this.orderModel.find(query).sort({ createdAt: -1 }).exec();
  }

  /**
   * Finds all orders where the user is the seller.
   * @param sellerId - The seller's user ID.
   * @param status - Optional status filter.
   * @returns List of orders.
   */
  async findBySeller(sellerId: string, status?: OrderStatus): Promise<Order[]> {
    const query: Record<string, unknown> = { sellerId };
    if (status) {
      query.status = status;
    }
    return this.orderModel.find(query).sort({ createdAt: -1 }).exec();
  }

  /**
   * Finds a single order by ID.
   * @param id - The order ID.
   * @returns The order.
   */
  async findOne(id: string): Promise<Order> {
    const order = await this.orderModel.findById(id).exec();
    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }
    return order;
  }

  /**
   * Updates the status of an order.
   * @param id - The order ID.
   * @param status - The new status.
   * @returns The updated order.
   */
  async updateStatus(id: string, status: OrderStatus): Promise<Order> {
    const order = await this.orderModel.findByIdAndUpdate(id, { status }, { new: true }).exec();
    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }
    return order;
  }

  /**
   * Cancels an order (sets status to CANCELLED).
   * @param id - The order ID.
   * @returns The cancelled order.
   */
  async cancel(id: string): Promise<Order> {
    return this.updateStatus(id, OrderStatus.CANCELLED);
  }
}
