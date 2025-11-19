import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ProductsService } from './products.service';
import { Product } from './schemas/product.schema';
import { describe, it, expect, beforeEach, vi } from 'vitest';

const mockProduct = {
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
  save: vi.fn().mockResolvedValue({
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
    _id: '1',
  }),
};

class MockProductModel {
  save: any;
  constructor(private data: any) {
    this.save = vi.fn().mockResolvedValue({ ...this.data, _id: '1' });
  }
  static find = vi.fn().mockReturnValue({ exec: vi.fn().mockResolvedValue([mockProduct]) });
  static findById = vi.fn().mockReturnValue({ exec: vi.fn().mockResolvedValue(mockProduct) });
}

describe('ProductsService', () => {
  let service: ProductsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: getModelToken(Product.name),
          useValue: MockProductModel,
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a product with dynamic attributes', async () => {
    const createProductDto = {
      name: 'Smartphone',
      description: 'High-end smartphone',
      price: 999,
      sku: 'PHONE-001',
      vertical: 'electronics',
      attributes: {
        screenSize: '6.5 inch',
        storage: '256GB',
        color: 'Black',
      },
      sellerId: 'seller123',
    };

    const result = await service.create(createProductDto);

    expect(result).toBeDefined();
    expect(result.name).toBe(createProductDto.name);
    expect(result.attributes).toEqual(createProductDto.attributes);
    expect(result.attributes.screenSize).toBe('6.5 inch');
  });
});
