import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PaymentService } from './payment.service';
import { Preference } from 'mercadopago';

// Mock the mercadopago module
vi.mock('mercadopago', async () => {
  const actual = await vi.importActual('mercadopago');
  const MockPreference = vi.fn();
  MockPreference.prototype.create = vi.fn();

  return {
    ...actual,
    default: vi.fn(), // Mock MercadoPagoConfig constructor
    Preference: MockPreference,
  };
});

describe('PaymentService', () => {
  let service: PaymentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        {
          provide: ConfigService,
          useValue: {
            get: vi.fn((key: string) => {
              if (key === 'MERCADOPAGO_ACCESS_TOKEN') return 'test_token';
              if (key === 'PAYMENT_SUCCESS_URL') return 'http://success';
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<PaymentService>(PaymentService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a payment link', async () => {
    const mockResponse = {
      id: '123',
      init_point: 'http://mp.link',
      sandbox_init_point: 'http://sandbox.mp.link',
    };

    // Setup the mock return value
    // We need to ensure we are mocking the method on the instance that the service is using.
    // Since we mocked the class, the service has an instance of the mock.
    // We can find the instance via the mock.instances array of the mocked class.

    // Re-acquiring the mock instance in case it changed (it shouldn't)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mockInstance = (Preference as unknown as any).mock.instances[0];
    mockInstance.create.mockResolvedValue(mockResponse);

    const result = await service.createPaymentLink('order_1', 'Test Product', 100);

    expect(result).toEqual(mockResponse);
    expect(mockInstance.create).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.objectContaining({
          items: expect.arrayContaining([
            expect.objectContaining({
              id: 'order_1',
              title: 'Test Product',
              unit_price: 100,
            }),
          ]),
          external_reference: 'order_1',
        }),
      }),
    );
  });

  it('should handle errors from Mercado Pago', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mockInstance = (Preference as unknown as any).mock.instances[0];
    mockInstance.create.mockRejectedValue(new Error('API Error'));

    await expect(service.createPaymentLink('order_1', 'Test', 100)).rejects.toThrow('API Error');
  });
});
