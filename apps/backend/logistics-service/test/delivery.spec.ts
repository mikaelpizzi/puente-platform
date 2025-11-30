import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { DeliveryStatus } from '../src/delivery/dto/update-status.dto';

process.env.GATEWAY_SHARED_SECRET = 'test-secret';

const mockRedis = {
  get: vi.fn(),
  set: vi.fn(),
  publish: vi.fn(),
  geoadd: vi.fn(),
  georadius: vi.fn(),
};

describe('DeliveryController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider('REDIS_CLIENT')
      .useValue(mockRedis)
      .overrideProvider(ConfigService)
      .useValue({
        get: (key: string) => {
          if (key === 'GATEWAY_SHARED_SECRET') return 'test-secret';
          return null;
        },
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/deliveries (POST) - Create Delivery', async () => {
    const createDto = {
      orderId: 'order-123',
      pickupLocation: { lat: -34.6, lng: -58.4 },
      dropoffLocation: { lat: -34.7, lng: -58.5 },
    };

    mockRedis.set.mockResolvedValue('OK');

    const response = await request(app.getHttpServer())
      .post('/deliveries')
      .set('x-gateway-secret', process.env.GATEWAY_SHARED_SECRET || 'test-secret') // Mock secret
      .send(createDto)
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body.status).toBe(DeliveryStatus.PENDING);
    expect(mockRedis.set).toHaveBeenCalled();
  });

  it('/deliveries/:id/assign (PATCH) - Assign Driver', async () => {
    const deliveryId = 'delivery-123';
    const driverId = 'driver-456';
    const existingDelivery = {
      id: deliveryId,
      status: DeliveryStatus.PENDING,
      orderId: 'order-123',
    };

    mockRedis.get.mockResolvedValue(JSON.stringify(existingDelivery));
    mockRedis.set.mockResolvedValue('OK');
    mockRedis.publish.mockResolvedValue(1);

    const response = await request(app.getHttpServer())
      .patch(`/deliveries/${deliveryId}/assign`)
      .set('x-gateway-secret', process.env.GATEWAY_SHARED_SECRET || 'test-secret')
      .send({ driverId })
      .expect(200);

    expect(response.body.driverId).toBe(driverId);
    expect(response.body.status).toBe(DeliveryStatus.ASSIGNED);
    expect(mockRedis.publish).toHaveBeenCalledWith(
      'delivery.assigned',
      expect.stringContaining(driverId),
    );
  });

  it('/deliveries/:id/status (PATCH) - Update Status', async () => {
    const deliveryId = 'delivery-123';
    const existingDelivery = {
      id: deliveryId,
      status: DeliveryStatus.ASSIGNED,
      driverId: 'driver-456',
    };

    mockRedis.get.mockResolvedValue(JSON.stringify(existingDelivery));
    mockRedis.set.mockResolvedValue('OK');
    mockRedis.publish.mockResolvedValue(1);

    const response = await request(app.getHttpServer())
      .patch(`/deliveries/${deliveryId}/status`)
      .set('x-gateway-secret', process.env.GATEWAY_SHARED_SECRET || 'test-secret')
      .send({ status: DeliveryStatus.PICKED_UP })
      .expect(200);

    expect(response.body.status).toBe(DeliveryStatus.PICKED_UP);
    expect(mockRedis.publish).toHaveBeenCalledWith(
      'delivery.status.updated',
      expect.stringContaining(DeliveryStatus.PICKED_UP),
    );
  });

  it('/deliveries/:id/tracking (GET) - Get Tracking Link', async () => {
    const deliveryId = 'delivery-123';

    const response = await request(app.getHttpServer())
      .get(`/deliveries/${deliveryId}/tracking`)
      .set('x-gateway-secret', process.env.GATEWAY_SHARED_SECRET || 'test-secret')
      .expect(200);

    expect(response.body.url).toContain(`https://puente.app/track/${deliveryId}`);
  });
});
