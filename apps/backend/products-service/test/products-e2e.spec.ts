import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { ProductsController } from '../src/products/products.controller';
import { ProductsService } from '../src/products/products.service';
import { RolesGuard } from '../src/common/guards/roles.guard';
import { Role } from '../src/common/enums/role.enum';

describe('ProductsController (e2e) - RBAC', () => {
  let app: INestApplication;
  const mockProductsService = {
    create: vi.fn().mockResolvedValue({ id: '1', name: 'Test' }),
    findAll: vi.fn().mockResolvedValue([]),
    findOne: vi.fn().mockResolvedValue({ id: '1' }),
    update: vi.fn().mockResolvedValue({ id: '1', name: 'Updated' }),
    remove: vi.fn().mockResolvedValue({ id: '1' }),
    reserveStock: vi.fn().mockResolvedValue(true),
    releaseStock: vi.fn().mockResolvedValue(true),
    confirmStock: vi.fn().mockResolvedValue(true),
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        {
          provide: ProductsService,
          useValue: mockProductsService,
        },
        RolesGuard, // Ensure Guard is provided if it relies on DI (Reflector)
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /products', () => {
    it('should allow SELLER', () => {
      return request(app.getHttpServer())
        .post('/products')
        .set('X-User-Role', Role.SELLER)
        .send({
          name: 'P1',
          description: 'D1',
          price: 10,
          sku: 'SKU1',
          vertical: 'V1',
          sellerId: 'S1',
        })
        .expect(201);
    });

    it('should allow ADMIN', () => {
      return request(app.getHttpServer())
        .post('/products')
        .set('X-User-Role', Role.ADMIN)
        .send({
          name: 'P1',
          description: 'D1',
          price: 10,
          sku: 'SKU1',
          vertical: 'V1',
          sellerId: 'S1',
        })
        .expect(201);
    });

    it('should deny BUYER', () => {
      return request(app.getHttpServer())
        .post('/products')
        .set('X-User-Role', Role.BUYER)
        .send({
          name: 'P1',
          description: 'D1',
          price: 10,
          sku: 'SKU1',
          vertical: 'V1',
          sellerId: 'S1',
        })
        .expect(403);
    });

    it('should deny if no role header', () => {
      return request(app.getHttpServer())
        .post('/products')
        .send({
          name: 'P1',
          description: 'D1',
          price: 10,
          sku: 'SKU1',
          vertical: 'V1',
          sellerId: 'S1',
        })
        .expect(403);
    });
  });

  describe('GET /products', () => {
    it('should be public (no role required)', () => {
      return request(app.getHttpServer()).get('/products').expect(200);
    });
  });

  describe('DELETE /products/:id', () => {
    it('should deny BUYER', () => {
      return request(app.getHttpServer())
        .delete('/products/1')
        .set('X-User-Role', Role.BUYER)
        .expect(403);
    });

    it('should allow ADMIN', () => {
      return request(app.getHttpServer())
        .delete('/products/1')
        .set('X-User-Role', Role.ADMIN)
        .expect(200);
    });
  });
});
