import { Test, TestingModule } from '@nestjs/testing';
import { FinanceService } from './finance.service';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus, LedgerType, LedgerCategory } from '@prisma/client';
import { PaymentService } from '../payment/payment.service';

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
      ],
    }).compile();

    service = module.get<FinanceService>(FinanceService);
    prisma = module.get(PrismaService);
    vi.clearAllMocks();
  });

  it('should create an order and ledger entries', async () => {
    const dto = {
      sellerId: 'seller1',
      buyerId: 'buyer1',
      items: [{ productId: 'p1', quantity: 2, price: 100 }], // Total 200
    };

    const mockOrder = { id: 'order1', ...dto, totalAmount: 200 };
    prisma.order.create.mockResolvedValue(mockOrder);

    const result = await service.createOrder(dto);

    expect(prisma.order.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          totalAmount: 200,
          status: OrderStatus.PENDING,
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

    expect(result).toEqual(mockOrder);
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
