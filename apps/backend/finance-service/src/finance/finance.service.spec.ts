import { Test, TestingModule } from '@nestjs/testing';
import { FinanceService } from './finance.service';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus, LedgerType, LedgerCategory } from '@prisma/client';
import { PaymentService } from '../payment/payment.service';
import { EventsService } from '../events/events.service';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockPrismaService: any = {
  order: {
    create: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  commission: {
    create: vi.fn(),
  },
  ledgerEntry: {
    create: vi.fn(),
  },
};
mockPrismaService.$transaction = vi.fn((callback) => callback(mockPrismaService));

const mockPaymentService = {
  createPaymentLink: vi.fn(),
  createMultiOrderPaymentLink: vi.fn(),
};

const mockEventsService = {
  publishPaymentReceived: vi.fn().mockResolvedValue(1),
  publishOrderCreated: vi.fn().mockResolvedValue(1),
  publishEvent: vi.fn().mockResolvedValue(1),
};

describe('FinanceService', () => {
  let service: FinanceService;
  let prisma: typeof mockPrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FinanceService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: PaymentService, useValue: mockPaymentService },
        { provide: EventsService, useValue: mockEventsService },
      ],
    }).compile();

    service = module.get<FinanceService>(FinanceService);
    prisma = module.get(PrismaService);
    vi.clearAllMocks();
  });

  it('should create an order and ledger entries (single seller)', async () => {
    const dto = {
      buyerId: 'buyer1',
      items: [{ productId: 'p1', sellerId: 'seller1', quantity: 2, price: 100 }], // Total 200
    };

    const mockOrder = { id: 'order1', sellerId: 'seller1', buyerId: 'buyer1', totalAmount: 200 };
    prisma.order.create.mockResolvedValue(mockOrder);
    mockPaymentService.createMultiOrderPaymentLink.mockResolvedValue({
      id: 'pref1',
      init_point: 'http://pay.link',
    });

    const result = await service.createOrder(dto);

    expect(prisma.order.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          totalAmount: 200,
          status: OrderStatus.PENDING,
          sellerId: 'seller1',
        }),
      }),
    );

    // Commission 5% of 200 = 10
    expect(prisma.commission.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          amount: 10,
          rate: 0.05,
        }),
      }),
    );

    // Ledger: Credit Sale 200
    expect(prisma.ledgerEntry.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          amount: 200,
          type: LedgerType.CREDIT,
          category: LedgerCategory.SALE,
        }),
      }),
    );

    // Ledger: Debit Commission 10
    expect(prisma.ledgerEntry.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          amount: 10,
          type: LedgerType.DEBIT,
          category: LedgerCategory.COMMISSION,
        }),
      }),
    );

    // Verify Split Orders response structure
    expect(result).toHaveProperty('orders');
    expect(result).toHaveProperty('paymentLink');
    expect(result).toHaveProperty('grandTotal');
    expect(result.orders).toHaveLength(1);
    expect(result.grandTotal).toBe(200);
  });

  it('should create multiple orders for multi-seller cart (Split Orders)', async () => {
    const dto = {
      buyerId: 'buyer1',
      items: [
        { productId: 'p1', sellerId: 'seller1', quantity: 1, price: 100 },
        { productId: 'p2', sellerId: 'seller2', quantity: 2, price: 50 }, // Total: 100
      ],
    };

    const mockOrder1 = { id: 'order1', sellerId: 'seller1', totalAmount: 100 };
    const mockOrder2 = { id: 'order2', sellerId: 'seller2', totalAmount: 100 };
    prisma.order.create.mockResolvedValueOnce(mockOrder1).mockResolvedValueOnce(mockOrder2);
    mockPaymentService.createMultiOrderPaymentLink.mockResolvedValue({
      id: 'pref1',
      init_point: 'http://pay.link',
    });

    const result = await service.createOrder(dto);

    // Should create 2 orders
    expect(prisma.order.create).toHaveBeenCalledTimes(2);
    // Should create 2 commissions
    expect(prisma.commission.create).toHaveBeenCalledTimes(2);
    // Should create 4 ledger entries (2 sales + 2 commissions)
    expect(prisma.ledgerEntry.create).toHaveBeenCalledTimes(4);

    // Verify response
    expect(result.orders).toHaveLength(2);
    expect(result.grandTotal).toBe(200); // 100 + 100
    expect(mockPaymentService.createMultiOrderPaymentLink).toHaveBeenCalledWith(
      ['order1', 'order2'],
      expect.stringContaining('2 Orders'),
      200,
    );
  });

  it('should generate payment link for an order', async () => {
    const orderId = 'order1';
    const mockOrder = { id: orderId, totalAmount: 100 };
    const mockPaymentResponse = { id: 'pay1', init_point: 'http://link' };

    prisma.order.findUnique.mockResolvedValue(mockOrder);
    mockPaymentService.createPaymentLink.mockResolvedValue(mockPaymentResponse);

    const result = await service.generatePaymentForOrder(orderId);

    expect(prisma.order.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: orderId } }),
    );
    expect(mockPaymentService.createPaymentLink).toHaveBeenCalledWith(
      orderId,
      expect.stringContaining('Order #order1'),
      100,
    );
    expect(result).toEqual(mockPaymentResponse);
  });

  it('should throw if order not found during payment generation', async () => {
    prisma.order.findUnique.mockResolvedValue(null);
    await expect(service.generatePaymentForOrder('invalid')).rejects.toThrow('Order not found');
  });

  it('should compensate an order (Saga pattern)', async () => {
    const orderId = 'order1';
    const mockOrder = {
      id: orderId,
      status: OrderStatus.PENDING,
      ledgerEntries: [
        {
          id: 'l1',
          amount: 200,
          type: LedgerType.CREDIT,
          category: LedgerCategory.SALE,
          userId: 'seller1',
        },
        {
          id: 'l2',
          amount: 10,
          type: LedgerType.DEBIT,
          category: LedgerCategory.COMMISSION,
          userId: 'seller1',
        },
      ],
    };

    prisma.order.findUnique.mockResolvedValue(mockOrder);
    prisma.order.update.mockResolvedValue({ ...mockOrder, status: OrderStatus.FAILED });

    await service.compensateOrder(orderId, 'Test failure');

    // Should update status to FAILED
    expect(prisma.order.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: orderId },
        data: { status: OrderStatus.FAILED },
      }),
    );

    // Should reverse ledger entries
    // Reverse Sale (Credit -> Debit)
    expect(prisma.ledgerEntry.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          amount: 200,
          type: LedgerType.DEBIT,
          category: LedgerCategory.REFUND,
          referenceId: 'l1',
        }),
      }),
    );

    // Reverse Commission (Debit -> Credit)
    expect(prisma.ledgerEntry.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          amount: 10,
          type: LedgerType.CREDIT,
          category: LedgerCategory.REFUND,
          referenceId: 'l2',
        }),
      }),
    );
  });

  it('should not compensate if order is already failed or cancelled', async () => {
    const orderId = 'order1';
    const mockOrder = {
      id: orderId,
      status: OrderStatus.FAILED,
      ledgerEntries: [],
    };

    prisma.order.findUnique.mockResolvedValue(mockOrder);

    await service.compensateOrder(orderId, 'Retry');

    expect(prisma.order.update).not.toHaveBeenCalled();
    expect(prisma.ledgerEntry.create).not.toHaveBeenCalled();
  });
});
