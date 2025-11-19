import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ProductsService } from './products.service';
import { Product } from './schemas/product.schema';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';

const mockProduct = {
  _id: '1',
  name: 'Test Product',
  description: 'Description',
  price: 100,
  sku: 'SKU123',
  vertical: 'electronics',
  attributes: {
    brand: 'TestBrand',
    warranty: '2 years',
  },
  sellerId: 'seller1',
  stock: 10,
  reservedStock: 0,
};

class MockModel {
  save: any;
  constructor(private data: any) {
    this.save = vi.fn().mockResolvedValue({ ...this.data, _id: '1' });
  }
  static find = vi.fn().mockReturnValue({ exec: vi.fn().mockResolvedValue([mockProduct]) });
  static findById = vi.fn().mockReturnValue({ exec: vi.fn().mockResolvedValue(mockProduct) });
  static findByIdAndUpdate = vi
    .fn()
    .mockReturnValue({ exec: vi.fn().mockResolvedValue(mockProduct) });
  static findByIdAndDelete = vi
    .fn()
    .mockReturnValue({ exec: vi.fn().mockResolvedValue(mockProduct) });
  static findOneAndUpdate = vi.fn();
}

describe('ProductsService', () => {
  let service: ProductsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: getModelToken(Product.name),
          useValue: MockModel,
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('CRUD', () => {
    it('should create a product', async () => {
      const dto = { ...mockProduct, stock: 10 };
      const result = await service.create(dto);
      expect(result).toBeDefined();
      expect((result as any)._id).toBe('1');
    });

    it('should update a product', async () => {
      const dto = { stock: 20 };
      MockModel.findByIdAndUpdate.mockReturnValue({
        exec: vi.fn().mockResolvedValue({ ...mockProduct, stock: 20 }),
      });
      const result = await service.update('1', dto);
      expect(result.stock).toBe(20);
    });

    it('should delete a product', async () => {
      const result = await service.remove('1');
      expect(result).toBeDefined();
    });
  });

  describe('reserveStock', () => {
    it('should reserve stock successfully', async () => {
      const items = [{ productId: '1', quantity: 2 }];

      MockModel.findById.mockReturnValue({ ...mockProduct, stock: 10, reservedStock: 0 });
      MockModel.findOneAndUpdate.mockResolvedValue({ ...mockProduct, stock: 10, reservedStock: 2 });

      const result = await service.reserveStock(items);
      expect(result).toBe(true);
      expect(MockModel.findOneAndUpdate).toHaveBeenCalled();
    });

    it('should fail if insufficient stock', async () => {
      const items = [{ productId: '1', quantity: 20 }];
      MockModel.findById.mockReturnValue({ ...mockProduct, stock: 10, reservedStock: 0 });

      await expect(service.reserveStock(items)).rejects.toThrow(BadRequestException);
    });

    it('should rollback if one item fails', async () => {
      const items = [
        { productId: '1', quantity: 2 },
        { productId: '2', quantity: 20 }, // This one fails
      ];

      // Mock findById to return different products
      MockModel.findById.mockImplementation((id) => {
        if (id === '1') return { ...mockProduct, _id: '1', stock: 10, reservedStock: 0 };
        if (id === '2') return { ...mockProduct, _id: '2', stock: 5, reservedStock: 0 }; // Insufficient
        return null;
      });

      // First item succeeds reservation
      MockModel.findOneAndUpdate.mockResolvedValue({ ...mockProduct, _id: '1', reservedStock: 2 });

      // Spy on releaseStock
      const releaseSpy = vi.spyOn(service, 'releaseStock');
      // Mock releaseStock implementation to avoid actual DB calls during rollback
      releaseSpy.mockResolvedValue(undefined);

      await expect(service.reserveStock(items)).rejects.toThrow(BadRequestException);

      // Expect rollback for item 1
      expect(releaseSpy).toHaveBeenCalledWith([{ productId: '1', quantity: 2 }]);
    });
  });
});
