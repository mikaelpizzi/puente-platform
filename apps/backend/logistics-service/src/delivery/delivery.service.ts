import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import Redis from 'ioredis';
import { CreateDeliveryDto } from './dto/create-delivery.dto';
import { UpdateStatusDto, DeliveryStatus } from './dto/update-status.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class DeliveryService {
  constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) {}

  async createDelivery(dto: CreateDeliveryDto) {
    const deliveryId = uuidv4();
    const delivery = {
      id: deliveryId,
      ...dto,
      status: dto.driverId ? DeliveryStatus.ASSIGNED : DeliveryStatus.PENDING,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await this.redis.set(`delivery:${deliveryId}`, JSON.stringify(delivery));
    return delivery;
  }

  async getDelivery(id: string) {
    const data = await this.redis.get(`delivery:${id}`);
    if (!data) {
      throw new NotFoundException(`Delivery ${id} not found`);
    }
    return JSON.parse(data);
  }

  async updateStatus(id: string, dto: UpdateStatusDto) {
    const delivery = await this.getDelivery(id);
    delivery.status = dto.status;
    delivery.updatedAt = new Date().toISOString();

    await this.redis.set(`delivery:${id}`, JSON.stringify(delivery));

    // Publish event
    await this.redis.publish(
      'delivery.status.updated',
      JSON.stringify({ deliveryId: id, status: dto.status }),
    );

    return delivery;
  }

  async assignDriver(id: string, driverId: string) {
    const delivery = await this.getDelivery(id);
    delivery.driverId = driverId;
    delivery.status = DeliveryStatus.ASSIGNED;
    delivery.updatedAt = new Date().toISOString();

    await this.redis.set(`delivery:${id}`, JSON.stringify(delivery));

    // Publish event
    await this.redis.publish('delivery.assigned', JSON.stringify({ deliveryId: id, driverId }));

    return delivery;
  }

  generateTrackingLink(id: string) {
    // In a real app, this would be a frontend URL
    return `https://puente.app/track/${id}`;
  }
}
