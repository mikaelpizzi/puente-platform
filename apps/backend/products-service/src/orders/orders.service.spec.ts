import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { Order, OrderDocument, OrderStatus } from './schemas/order.schema';
import { CreateOrderDto } from './dto/create-order.dto';

// Mock Order data
const mockOrder: Partial<OrderDocument> = {
  _id: 'order-id-1' as unknown as OrderDocument['_id'],
  buyerId: 'buyer-123',
  sellerId: 'seller-456',
  status: OrderStatus.PENDING,
  items: [{ productId: 'prod-1', name: 'Test Product', quantity: 2, price: 50 }],
  total: 100,
};

// Type-safe mock model class following the project pattern
class MockOrderModel {
  private data: CreateOrderDto & { buyerId: string; status: OrderStatus };
  save: Mock<[], Promise<Partial<OrderDocument>>>;

  constructor(data: CreateOrderDto & { buyerId: string; status: OrderStatus }) {
    this.data = data;
    this.save = vi.fn().mockResolvedValue({ ...mockOrder, ...this.data });
  }

  static find: Mock = vi.fn().mockReturnValue({
    sort: vi.fn().mockReturnValue({
      exec: vi.fn().mockResolvedValue([mockOrder]),
    }),
  });

  static findById: Mock = vi.fn().mockReturnValue({
    exec: vi.fn().mockResolvedValue(mockOrder),
  });

  static findByIdAndUpdate: Mock = vi.fn().mockReturnValue({
    exec: vi.fn().mockResolvedValue({ ...mockOrder, status: OrderStatus.PROCESSING }),
  });
}

describe('OrdersService', () => {
  let service: OrdersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: getModelToken(Order.name),
          useValue: MockOrderModel,
        },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new order', async () => {
      const createOrderDto: CreateOrderDto = {
        sellerId: 'seller-456',
        items: [{ productId: 'prod-1', name: 'Test Product', quantity: 2, price: 50 }],
        total: 100,
      };

      const result = await service.create(createOrderDto, 'buyer-123');

      expect(result).toBeDefined();
      expect(result.buyerId).toBe('buyer-123');
      expect(result.sellerId).toBe('seller-456');
    });
  });

  describe('findByBuyer', () => {
    it('should return orders for a buyer', async () => {
      const result = await service.findByBuyer('buyer-123');

      expect(result).toHaveLength(1);
      expect(MockOrderModel.find).toHaveBeenCalledWith({ buyerId: 'buyer-123' });
    });

    it('should filter by status when provided', async () => {
      await service.findByBuyer('buyer-123', OrderStatus.PENDING);

      expect(MockOrderModel.find).toHaveBeenCalledWith({
        buyerId: 'buyer-123',
        status: OrderStatus.PENDING,
      });
    });
  });

  describe('findBySeller', () => {
    it('should return orders for a seller', async () => {
      const result = await service.findBySeller('seller-456');

      expect(result).toHaveLength(1);
      expect(MockOrderModel.find).toHaveBeenCalledWith({ sellerId: 'seller-456' });
    });
  });

  describe('findOne', () => {
    it('should return an order by ID', async () => {
      const result = await service.findOne('order-id-1');

      expect(result).toBeDefined();
      expect(MockOrderModel.findById).toHaveBeenCalledWith('order-id-1');
    });

    it('should throw NotFoundException if order not found', async () => {
      MockOrderModel.findById = vi.fn().mockReturnValue({
        exec: vi.fn().mockResolvedValue(null),
      });

      await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateStatus', () => {
    it('should update order status', async () => {
      const result = await service.updateStatus('order-id-1', OrderStatus.PROCESSING);

      expect(result.status).toBe(OrderStatus.PROCESSING);
      expect(MockOrderModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'order-id-1',
        { status: OrderStatus.PROCESSING },
        { new: true },
      );
    });

    it('should throw NotFoundException if order not found', async () => {
      MockOrderModel.findByIdAndUpdate = vi.fn().mockReturnValue({
        exec: vi.fn().mockResolvedValue(null),
      });

      await expect(service.updateStatus('non-existent', OrderStatus.PROCESSING)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('cancel', () => {
    it('should cancel an order', async () => {
      MockOrderModel.findByIdAndUpdate = vi.fn().mockReturnValue({
        exec: vi.fn().mockResolvedValue({ ...mockOrder, status: OrderStatus.CANCELLED }),
      });

      const result = await service.cancel('order-id-1');

      expect(result.status).toBe(OrderStatus.CANCELLED);
    });
  });
});
