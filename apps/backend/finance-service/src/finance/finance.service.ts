import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderStatus, LedgerType, LedgerCategory } from '../types/prisma-enums';
import { PaymentService } from '../payment/payment.service';

@Injectable()
export class FinanceService {
  private readonly logger = new Logger(FinanceService.name);
  private readonly COMMISSION_RATE = 0.05; // 5%

  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentService: PaymentService,
  ) {}

  async createOrder(dto: CreateOrderDto) {
    const totalAmount = dto.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const commissionAmount = totalAmount * this.COMMISSION_RATE;

    return this.prisma.$transaction(async (tx) => {
      // 1. Create Order
      const order = await tx.order.create({
        data: {
          sellerId: dto.sellerId,
          buyerId: dto.buyerId,
          totalAmount,
          status: OrderStatus.PENDING,
          sagaId: dto.sagaId,
          items: {
            create: dto.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
            })),
          },
        },
      });

      // 2. Create Commission Record
      await tx.commission.create({
        data: {
          orderId: order.id,
          amount: commissionAmount,
          rate: this.COMMISSION_RATE,
        },
      });

      // 3. Ledger: Credit Seller for the Sale
      await tx.ledgerEntry.create({
        data: {
          userId: dto.sellerId,
          amount: totalAmount,
          type: LedgerType.CREDIT,
          category: LedgerCategory.SALE,
          orderId: order.id,
          description: `Sale revenue for order ${order.id}`,
        },
      });

      // 4. Ledger: Debit Seller for Commission
      await tx.ledgerEntry.create({
        data: {
          userId: dto.sellerId,
          amount: commissionAmount,
          type: LedgerType.DEBIT,
          category: LedgerCategory.COMMISSION,
          orderId: order.id,
          description: `Platform commission for order ${order.id}`,
        },
      });

      this.logger.log(
        `Order ${order.id} created with total ${totalAmount} and commission ${commissionAmount}`,
      );
      return order;
    });
  }

  async generatePaymentForOrder(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    // Create a generic title for the payment
    const title = `Order #${order.id} - Puente Platform`;

    return this.paymentService.createPaymentLink(order.id, title, Number(order.totalAmount));
  }

  // Saga Compensation Pattern
  async compensateOrder(orderId: string, reason: string) {
    this.logger.warn(`Compensating order ${orderId}: ${reason}`);

    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { ledgerEntries: true },
      });

      if (!order) {
        throw new Error('Order not found');
      }

      if (order.status === OrderStatus.FAILED || order.status === OrderStatus.CANCELLED) {
        return order; // Already compensated
      }

      // 1. Update Order Status
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.FAILED },
      });

      // 2. Reverse Ledger Entries
      // We find the original entries and create opposite ones
      for (const entry of order.ledgerEntries) {
        await tx.ledgerEntry.create({
          data: {
            userId: entry.userId,
            amount: entry.amount,
            type: entry.type === LedgerType.CREDIT ? LedgerType.DEBIT : LedgerType.CREDIT, // Reverse type
            category: LedgerCategory.REFUND, // Or ADJUSTMENT
            orderId: order.id,
            description: `Compensation/Rollback for ${entry.category} (Ref: ${entry.id})`,
            referenceId: entry.id,
          },
        });
      }

      return updatedOrder;
    });
  }
}
