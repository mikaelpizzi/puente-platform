import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order, OrderDocument, OrderStatus } from './schemas/order.schema';
import { CreateOrderDto } from './dto/create-order.dto';
import { CompleteDeliveryDto } from './dto/complete-delivery.dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

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
   * Finds all orders assigned to a courier.
   * @param courierId - The courier's user ID.
   * @param status - Optional status filter.
   * @returns List of orders.
   */
  async findByCourier(courierId: string, status?: OrderStatus): Promise<Order[]> {
    const query: Record<string, unknown> = { courierId };
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

  /**
   * Assigns a courier to an order.
   * @param orderId - The order ID.
   * @param courierId - The courier's user ID.
   * @returns The updated order.
   */
  async assignCourier(orderId: string, courierId: string): Promise<Order> {
    const order = await this.orderModel
      .findByIdAndUpdate(orderId, { courierId, status: OrderStatus.SHIPPED }, { new: true })
      .exec();
    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }
    return order;
  }

  /**
   * Completes a delivery with Proof of Delivery (POD).
   * Uploads photo/signature to Cloudinary and marks order as DELIVERED.
   * @param orderId - The order ID.
   * @param courierId - The courier's user ID (for validation).
   * @param dto - The POD data (photo, signature, GPS, notes).
   * @returns The updated order with POD.
   */
  async completeDelivery(
    orderId: string,
    courierId: string,
    dto: CompleteDeliveryDto,
  ): Promise<Order> {
    // Find the order
    const order = await this.orderModel.findById(orderId).exec();
    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    // Validate that the courier is assigned to this order
    if (order.courierId !== courierId) {
      throw new ForbiddenException('You are not assigned to this order');
    }

    // Validate that order is in SHIPPED status (ready for delivery)
    if (order.status !== OrderStatus.SHIPPED) {
      throw new BadRequestException('Order must be in SHIPPED status to complete delivery');
    }

    // Validate that at least one POD evidence is provided
    if (!dto.photoBase64 && !dto.signatureBase64) {
      throw new BadRequestException(
        'At least one proof of delivery (photo or signature) is required',
      );
    }

    // Prepare POD data
    const proofOfDelivery: NonNullable<Order['proofOfDelivery']> = {
      capturedAt: new Date(),
      capturedBy: courierId,
      notes: dto.notes,
      latitude: dto.latitude,
      longitude: dto.longitude,
    };

    // Upload photo to Cloudinary if provided
    if (dto.photoBase64) {
      const photoResult = await this.cloudinaryService.uploadBase64(
        dto.photoBase64,
        'puente-pod/photos',
      );
      proofOfDelivery.photoUrl = photoResult.secure_url;
    }

    // Upload signature to Cloudinary if provided
    if (dto.signatureBase64) {
      const signatureResult = await this.cloudinaryService.uploadBase64(
        dto.signatureBase64,
        'puente-pod/signatures',
      );
      proofOfDelivery.signatureUrl = signatureResult.secure_url;
    }

    // Update order with POD and mark as DELIVERED
    const updatedOrder = await this.orderModel
      .findByIdAndUpdate(
        orderId,
        {
          proofOfDelivery,
          status: OrderStatus.DELIVERED,
          deliveredAt: new Date(),
        },
        { new: true },
      )
      .exec();

    if (!updatedOrder) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    return updatedOrder;
  }
}
