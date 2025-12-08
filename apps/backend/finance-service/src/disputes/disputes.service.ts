import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DisputeStatus, DisputeReason, EscrowStatus } from '@prisma/client';
import { CreateDisputeDto } from './dto/create-dispute.dto';
import { ResolveDisputeDto } from './dto/resolve-dispute.dto';

/**
 * Disputes Service
 *
 * Handles dispute lifecycle from opening to resolution.
 */
@Injectable()
export class DisputesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Open a new dispute (buyer only).
   */
  async openDispute(buyerId: string, dto: CreateDisputeDto) {
    // Find escrow
    const escrow = await this.prisma.escrow.findUnique({
      where: { orderId: dto.orderId },
    });

    if (!escrow) {
      throw new NotFoundException('No escrow found for this order');
    }

    // Verify buyer owns this order
    if (escrow.buyerId !== buyerId) {
      throw new ForbiddenException('Only the buyer can open a dispute');
    }

    // Check escrow status
    if (escrow.status !== EscrowStatus.HELD) {
      throw new BadRequestException(`Cannot dispute order in ${escrow.status} status`);
    }

    // Check if dispute already exists
    const existing = await this.prisma.dispute.findUnique({
      where: { escrowId: escrow.id },
    });

    if (existing) {
      throw new BadRequestException('Dispute already exists for this order');
    }

    // Create dispute and update escrow
    return this.prisma.$transaction(async (tx) => {
      // Mark escrow as disputed
      await tx.escrow.update({
        where: { id: escrow.id },
        data: { status: EscrowStatus.DISPUTED },
      });

      // Create dispute
      const dispute = await tx.dispute.create({
        data: {
          escrowId: escrow.id,
          orderId: dto.orderId,
          openedBy: buyerId,
          reason: dto.reason as DisputeReason,
          description: dto.description,
          evidence: dto.evidence || [],
          status: DisputeStatus.OPEN,
        },
        include: { escrow: true },
      });

      return dispute;
    });
  }

  /**
   * Add evidence to existing dispute.
   */
  async addEvidence(disputeId: string, buyerId: string, evidence: string[]) {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id: disputeId },
    });

    if (!dispute) {
      throw new NotFoundException('Dispute not found');
    }

    if (dispute.openedBy !== buyerId) {
      throw new ForbiddenException('Only dispute creator can add evidence');
    }

    if (dispute.status !== DisputeStatus.OPEN && dispute.status !== DisputeStatus.INVESTIGATING) {
      throw new BadRequestException('Cannot add evidence to resolved dispute');
    }

    return this.prisma.dispute.update({
      where: { id: disputeId },
      data: {
        evidence: { push: evidence },
      },
    });
  }

  /**
   * Set dispute to investigating (admin).
   */
  async startInvestigation(disputeId: string, adminId: string) {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id: disputeId },
    });

    if (!dispute) {
      throw new NotFoundException('Dispute not found');
    }

    if (dispute.status !== DisputeStatus.OPEN) {
      throw new BadRequestException('Dispute is not open');
    }

    return this.prisma.dispute.update({
      where: { id: disputeId },
      data: { status: DisputeStatus.INVESTIGATING },
    });
  }

  /**
   * Resolve dispute (admin only).
   */
  async resolveDispute(disputeId: string, adminId: string, dto: ResolveDisputeDto) {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id: disputeId },
      include: { escrow: true },
    });

    if (!dispute) {
      throw new NotFoundException('Dispute not found');
    }

    if (
      dispute.status === DisputeStatus.RESOLVED_BUYER ||
      dispute.status === DisputeStatus.RESOLVED_SELLER ||
      dispute.status === DisputeStatus.CLOSED
    ) {
      throw new BadRequestException('Dispute already resolved');
    }

    const newStatus =
      dto.winner === 'buyer' ? DisputeStatus.RESOLVED_BUYER : DisputeStatus.RESOLVED_SELLER;

    return this.prisma.dispute.update({
      where: { id: disputeId },
      data: {
        status: newStatus,
        resolution: dto.resolution,
        resolvedBy: adminId,
        resolvedAt: new Date(),
      },
      include: { escrow: true },
    });
  }

  /**
   * Get dispute by ID.
   */
  async getById(id: string) {
    return this.prisma.dispute.findUnique({
      where: { id },
      include: { escrow: true },
    });
  }

  /**
   * Get disputes by order ID.
   */
  async getByOrderId(orderId: string) {
    return this.prisma.dispute.findFirst({
      where: { orderId },
      include: { escrow: true },
    });
  }

  /**
   * Get all disputes for a user.
   */
  async getByUserId(userId: string) {
    return this.prisma.dispute.findMany({
      where: { openedBy: userId },
      include: { escrow: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get all open disputes (admin view).
   */
  async getOpenDisputes() {
    return this.prisma.dispute.findMany({
      where: {
        status: { in: [DisputeStatus.OPEN, DisputeStatus.INVESTIGATING] },
      },
      include: { escrow: true },
      orderBy: { createdAt: 'asc' },
    });
  }
}
