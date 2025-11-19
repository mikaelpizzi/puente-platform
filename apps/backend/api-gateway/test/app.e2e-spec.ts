import { describe, beforeAll, afterAll, it, expect } from 'vitest';
import * as http from 'http';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import * as jwt from 'jsonwebtoken';

describe('API Gateway (e2e)', () => {
  let app: INestApplication;
  let mockService: http.Server;
  const MOCK_SERVICE_PORT = 4000;
  const JWT_SECRET = 'test-secret';
  const SHARED_SECRET = 'dev-secret-key';

  beforeAll(async () => {
    // Start a mock downstream service
    await new Promise<void>((resolve) => {
      mockService = http
        .createServer((req, res) => {
          // The proxy middleware strips the first path segment (/products), so we expect /123
          if (req.url === '/123') {
            // Verify headers injected by Gateway
            const gatewaySecret = req.headers['x-gateway-secret'];
            const userId = req.headers['x-user-id'];

            if (gatewaySecret !== SHARED_SECRET) {
              res.writeHead(403);
              res.end('Forbidden: Missing Gateway Secret');
              return;
            }

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ id: 123, name: 'Test Product', userId }));
          } else {
            res.writeHead(404);
            res.end();
          }
        })
        .listen(MOCK_SERVICE_PORT, () => {
          console.log(`Mock service listening on port ${MOCK_SERVICE_PORT}`);
          resolve();
        });
    });

    // Set env vars for testing BEFORE creating the module
    process.env.API_GATEWAY_PORT = '3001';
    process.env.AUTH_JWT_ACCESS_SECRET = JWT_SECRET;
    process.env.AUTH_SERVICE_URL = `http://127.0.0.1:${MOCK_SERVICE_PORT}`; // Mock
    process.env.PRODUCTS_SERVICE_URL = `http://127.0.0.1:${MOCK_SERVICE_PORT}`; // Mock
    process.env.FINANCE_SERVICE_URL = `http://127.0.0.1:${MOCK_SERVICE_PORT}`; // Mock
    process.env.LOGISTICS_SERVICE_URL = `http://127.0.0.1:${MOCK_SERVICE_PORT}`; // Mock
    process.env.GATEWAY_SHARED_SECRET = SHARED_SECRET;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(ConfigService)
      .useValue({
        get: (key: string) => {
          const env = {
            API_GATEWAY_PORT: '3001',
            AUTH_JWT_ACCESS_SECRET: JWT_SECRET,
            AUTH_SERVICE_URL: `http://127.0.0.1:${MOCK_SERVICE_PORT}`,
            PRODUCTS_SERVICE_URL: `http://127.0.0.1:${MOCK_SERVICE_PORT}`,
            FINANCE_SERVICE_URL: `http://127.0.0.1:${MOCK_SERVICE_PORT}`,
            LOGISTICS_SERVICE_URL: `http://127.0.0.1:${MOCK_SERVICE_PORT}`,
            GATEWAY_SHARED_SECRET: SHARED_SECRET,
          };
          return env[key as keyof typeof env];
        },
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
    if (mockService) {
      mockService.close();
    }
  });

  it('/products/123 (GET) - should fail without token', () => {
    return request(app.getHttpServer()).get('/products/123').expect(401);
  });

  it('/products/123 (GET) - should fail with invalid token', () => {
    return request(app.getHttpServer())
      .get('/products/123')
      .set('Authorization', 'Bearer invalid-token')
      .expect(401);
  });

  it('/products/123 (GET) - should pass with valid token and forward headers', async () => {
    const token = jwt.sign({ sub: 'user-123', role: 'seller' }, JWT_SECRET);

    const response = await request(app.getHttpServer())
      .get('/products/123')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body).toEqual({
      id: 123,
      name: 'Test Product',
      userId: 'user-123',
    });
  });
});
