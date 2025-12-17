import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderStatus, LedgerType, LedgerCategory } from '@prisma/client';
import { PaymentService } from '../payment/payment.service';
import { EventsService } from '../events/events.service';

@Injectable()
export class FinanceService {
  private readonly logger = new Logger(FinanceService.name);
  private readonly COMMISSION_RATE = 0.05; // 5%

  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentService: PaymentService,
    private readonly eventsService: EventsService,
  ) {}

  /**
   * Creates orders using Split Orders architecture (Amazon/Mercado Libre model).
   * Groups items by sellerId and creates separate Order entities per seller,
   * but generates a single unified payment link.
   */
  async createOrder(dto: CreateOrderDto) {
    // 1. Group items by sellerId
    const itemsBySeller = new Map<string, typeof dto.items>();
    for (const item of dto.items) {
      const existing = itemsBySeller.get(item.sellerId) || [];
      existing.push(item);
      itemsBySeller.set(item.sellerId, existing);
    }

    this.logger.log(
      `Processing Split Order: ${dto.items.length} items from ${itemsBySeller.size} seller(s)`,
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const orders: any[] = [];
    let grandTotal = 0;

    // 2. ACID Transaction: Create one order per seller
    await this.prisma.$transaction(async (tx) => {
      for (const [sellerId, items] of itemsBySeller) {
        // Calculate subtotal for this seller
        const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const commissionAmount = subtotal * this.COMMISSION_RATE;
        grandTotal += subtotal;

        // Create Order for this seller
        const order = await tx.order.create({
          data: {
            sellerId,
            buyerId: dto.buyerId,
            totalAmount: subtotal,
            status: OrderStatus.PENDING,
            sagaId: dto.sagaId,
            items: {
              create: items.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
                price: item.price,
              })),
            },
          },
          include: { items: true },
        });

        // Create Commission Record
        await tx.commission.create({
          data: {
            orderId: order.id,
            amount: commissionAmount,
            rate: this.COMMISSION_RATE,
          },
        });

        // Ledger: Credit Seller for the Sale
        await tx.ledgerEntry.create({
          data: {
            userId: sellerId,
            amount: subtotal,
            type: LedgerType.CREDIT,
            category: LedgerCategory.SALE,
            orderId: order.id,
            description: `Sale revenue for order ${order.id}`,
          },
        });

        // Ledger: Debit Seller for Commission
        await tx.ledgerEntry.create({
          data: {
            userId: sellerId,
            amount: commissionAmount,
            type: LedgerType.DEBIT,
            category: LedgerCategory.COMMISSION,
            orderId: order.id,
            description: `Platform commission for order ${order.id}`,
          },
        });

        this.logger.log(
          `Order ${order.id} created for seller ${sellerId} with total ${subtotal} and commission ${commissionAmount}`,
        );

        orders.push(order);
      }
    });

    // 3. Generate a single payment link for all orders
    const orderIds = orders.map((o) => o.id);
    const paymentTitle =
      orders.length === 1
        ? `Order #${orders[0].id} - Puente Platform`
        : `${orders.length} Orders - Puente Platform`;

    const paymentLink = await this.paymentService.createMultiOrderPaymentLink(
      orderIds,
      paymentTitle,
      grandTotal,
    );

    this.logger.log(
      `Split Order completed: ${orders.length} orders created, grandTotal: ${grandTotal}`,
    );

    return {
      orders,
      paymentLink,
      grandTotal,
    };
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

  async getOrder(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    return order;
  }

  async addFunds(userId: string, amount: number) {
    return this.prisma.ledgerEntry.create({
      data: {
        userId,
        amount,
        type: LedgerType.CREDIT,
        category: LedgerCategory.ADJUSTMENT,
        description: 'Dev TopUp',
      },
    });
  }

  /**
   * Handles payment confirmation from MercadoPago webhook.
   * Parses external_reference (JSON with orderIds) and updates all orders to PAID.
   * Publishes order.paid events because we don't emit here.
   */
  async handlePaymentConfirmation(externalReference: string) {
    this.logger.log(`Processing payment confirmation: ${externalReference}`);

    let orderIds: string[];

    // Parse external_reference - can be JSON or single order ID
    try {
      const parsed = JSON.parse(externalReference);
      if (parsed.type === 'multi_order' && Array.isArray(parsed.orderIds)) {
        orderIds = parsed.orderIds;
      } else if (parsed.orderIds) {
        orderIds = parsed.orderIds;
      } else {
        // Fallback to single order
        orderIds = [externalReference];
      }
    } catch {
      // Not JSON, treat as single order ID
      orderIds = [externalReference];
    }

    this.logger.log(`Found ${orderIds.length} order(s) to mark as PAID: ${orderIds.join(', ')}`);

    // Update all orders to PAID in a transaction
    const updatedOrders = await this.prisma.$transaction(async (tx) => {
      const orders = [];
      for (const orderId of orderIds) {
        const order = await tx.order.update({
          where: { id: orderId },
          data: { status: OrderStatus.PAID },
          include: { items: true },
        });
        orders.push(order);
        this.logger.log(`Order ${orderId} marked as PAID`);
      }
      return orders;
    });

    // Publish payment.received events for each order via Redis
    // notification-service listens on 'notifications' channel
    for (const order of updatedOrders) {
      try {
        await this.eventsService.publishPaymentReceived(
          order.id,
          order.sellerId,
          order.buyerId,
          Number(order.totalAmount),
        );
      } catch (error) {
        // Log but don't fail - payment was already processed
        this.logger.error(`Failed to publish event for order ${order.id}:`, error);
      }
    }

    return {
      success: true,
      ordersUpdated: orderIds.length,
      orderIds,
    };
  }
}
