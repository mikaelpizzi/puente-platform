import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EscrowStatus, LedgerType, LedgerCategory } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Escrow Service
 *
 * Manages fund freezing after payment and controlled release.
 */
@Injectable()
export class EscrowService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create escrow when order is paid.
   * Funds are frozen until delivery confirmation or dispute resolution.
   */
  async createEscrow(orderId: string, amount: number, sellerId: string, buyerId: string) {
    // Check if escrow already exists
    const existing = await this.prisma.escrow.findUnique({
      where: { orderId },
    });

    if (existing) {
      throw new BadRequestException('Escrow already exists for this order');
    }

    // Create escrow and ledger entry
    const escrow = await this.prisma.$transaction(async (tx) => {
      const newEscrow = await tx.escrow.create({
        data: {
          orderId,
          amount: new Decimal(amount),
          sellerId,
          buyerId,
          status: EscrowStatus.HELD,
        },
      });

      // Ledger entry: debit from buyer (escrow hold)
      await tx.ledgerEntry.create({
        data: {
          userId: buyerId,
          amount: new Decimal(amount),
          type: LedgerType.DEBIT,
          category: LedgerCategory.SALE,
          description: `Escrow hold for order ${orderId}`,
          orderId,
          referenceId: newEscrow.id,
        },
      });

      return newEscrow;
    });

    return escrow;
  }

  /**
   * Release funds to seller (order completed successfully).
   */
  async releaseToSeller(escrowId: string, adminId: string, note?: string) {
    const escrow = await this.prisma.escrow.findUnique({
      where: { id: escrowId },
    });

    if (!escrow) {
      throw new NotFoundException('Escrow not found');
    }

    if (escrow.status !== EscrowStatus.HELD) {
      throw new BadRequestException(`Cannot release escrow in ${escrow.status} status`);
    }

    return this.prisma.$transaction(async (tx) => {
      // Update escrow status
      const updated = await tx.escrow.update({
        where: { id: escrowId },
        data: {
          status: EscrowStatus.RELEASED_SELLER,
          releasedAt: new Date(),
          releasedBy: adminId,
          releaseNote: note,
        },
      });

      // Credit seller
      await tx.ledgerEntry.create({
        data: {
          userId: escrow.sellerId,
          amount: escrow.amount,
          type: LedgerType.CREDIT,
          category: LedgerCategory.SALE,
          description: `Payment released for order ${escrow.orderId}`,
          orderId: escrow.orderId,
          referenceId: escrowId,
        },
      });

      return updated;
    });
  }

  /**
   * Refund to buyer (dispute resolved in buyer's favor).
   */
  async releaseToBuyer(escrowId: string, adminId: string, note?: string) {
    const escrow = await this.prisma.escrow.findUnique({
      where: { id: escrowId },
    });

    if (!escrow) {
      throw new NotFoundException('Escrow not found');
    }

    if (escrow.status !== EscrowStatus.DISPUTED) {
      throw new BadRequestException('Escrow must be in DISPUTED status to refund');
    }

    return this.prisma.$transaction(async (tx) => {
      // Update escrow status
      const updated = await tx.escrow.update({
        where: { id: escrowId },
        data: {
          status: EscrowStatus.RELEASED_BUYER,
          releasedAt: new Date(),
          releasedBy: adminId,
          releaseNote: note,
        },
      });

      // Credit buyer (refund)
      await tx.ledgerEntry.create({
        data: {
          userId: escrow.buyerId,
          amount: escrow.amount,
          type: LedgerType.CREDIT,
          category: LedgerCategory.REFUND,
          description: `Refund for order ${escrow.orderId}`,
          orderId: escrow.orderId,
          referenceId: escrowId,
        },
      });

      return updated;
    });
  }

  /**
   * Get escrow by order ID.
   */
  async getByOrderId(orderId: string) {
    return this.prisma.escrow.findUnique({
      where: { orderId },
      include: { dispute: true },
    });
  }

  /**
   * Get all escrows for a user (buyer or seller).
   */
  async getByUserId(userId: string, role: 'buyer' | 'seller') {
    const where = role === 'buyer' ? { buyerId: userId } : { sellerId: userId };

    return this.prisma.escrow.findMany({
      where,
      include: { dispute: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get all pending escrows (admin view).
   */
  async getPendingEscrows() {
    return this.prisma.escrow.findMany({
      where: {
        status: { in: [EscrowStatus.HELD, EscrowStatus.DISPUTED] },
      },
      include: { dispute: true },
      orderBy: { createdAt: 'asc' },
    });
  }
}
