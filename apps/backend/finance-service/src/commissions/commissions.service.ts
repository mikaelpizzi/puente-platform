import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LedgerType, LedgerCategory } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { CreateCommissionRuleDto } from './dto/create-rule.dto';
import { UpdateCommissionRuleDto } from './dto/update-rule.dto';

// Platform account ID (fixed identifier for ledger entries)
const PLATFORM_ACCOUNT_ID = 'PLATFORM';

export interface CommissionResult {
  totalAmount: number;
  sellerAmount: number;
  platformFee: number;
  appliedRule: { id: string; name: string; rate: number } | null;
}

/**
 * Commissions Service
 *
 * Configurable commission engine for calculating platform fees.
 * Supports rules by category, campaign, seller, with priority ordering.
 */
@Injectable()
export class CommissionsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Calculate commission for an order amount.
   * Uses priority-based rule matching.
   */
  async calculateCommission(
    amount: number,
    options: {
      category?: string;
      campaignId?: string;
      sellerId?: string;
    } = {},
  ): Promise<CommissionResult> {
    const now = new Date();

    // Find applicable rule with highest priority
    const rule = await this.prisma.commissionRule.findFirst({
      where: {
        isActive: true,
        validFrom: { lte: now },
        AND: [
          // Validity check
          {
            OR: [{ validUntil: null }, { validUntil: { gte: now } }],
          },
          // Target matching (seller > campaign > category > default)
          {
            OR: [
              ...(options.sellerId ? [{ sellerId: options.sellerId }] : []),
              ...(options.campaignId ? [{ campaignId: options.campaignId }] : []),
              ...(options.category ? [{ category: options.category }] : []),
              { sellerId: null, campaignId: null, category: null }, // Default rule
            ],
          },
        ],
      },
      orderBy: { priority: 'desc' },
    });

    if (!rule) {
      // No rule found, return full amount to seller (0% commission)
      return {
        totalAmount: amount,
        sellerAmount: amount,
        platformFee: 0,
        appliedRule: null,
      };
    }

    // Calculate commission
    let fee = amount * Number(rule.rate);

    // Apply minimum
    const minAmount = Number(rule.minAmount);
    if (fee < minAmount) {
      fee = minAmount;
    }

    // Apply maximum cap if set
    if (rule.maxAmount) {
      const maxAmount = Number(rule.maxAmount);
      if (fee > maxAmount) {
        fee = maxAmount;
      }
    }

    // Round to 2 decimal places
    fee = Math.round(fee * 100) / 100;

    return {
      totalAmount: amount,
      sellerAmount: Math.round((amount - fee) * 100) / 100,
      platformFee: fee,
      appliedRule: {
        id: rule.id,
        name: rule.name,
        rate: Number(rule.rate),
      },
    };
  }

  /**
   * Apply commission split and create ledger entries.
   */
  async applyCommissionSplit(
    orderId: string,
    sellerId: string,
    amount: number,
    options: {
      category?: string;
      campaignId?: string;
    } = {},
  ) {
    const commission = await this.calculateCommission(amount, {
      ...options,
      sellerId,
    });

    return this.prisma.$transaction(async (tx) => {
      // Credit seller (minus commission)
      await tx.ledgerEntry.create({
        data: {
          userId: sellerId,
          amount: new Decimal(commission.sellerAmount),
          type: LedgerType.CREDIT,
          category: LedgerCategory.SALE,
          description: `Sale for order ${orderId}`,
          orderId,
          referenceId: commission.appliedRule?.id,
        },
      });

      // Credit platform (commission)
      if (commission.platformFee > 0) {
        await tx.ledgerEntry.create({
          data: {
            userId: PLATFORM_ACCOUNT_ID,
            amount: new Decimal(commission.platformFee),
            type: LedgerType.CREDIT,
            category: LedgerCategory.PLATFORM_FEE,
            description: `Commission from order ${orderId} (${commission.appliedRule?.name || 'default'})`,
            orderId,
            referenceId: commission.appliedRule?.id,
          },
        });

        // Update Commission record if exists
        await tx.commission.upsert({
          where: { orderId },
          create: {
            orderId,
            amount: new Decimal(commission.platformFee),
            rate: new Decimal(commission.appliedRule?.rate || 0),
          },
          update: {
            amount: new Decimal(commission.platformFee),
            rate: new Decimal(commission.appliedRule?.rate || 0),
          },
        });
      }

      return commission;
    });
  }

  // ==================== CRUD for Commission Rules ====================

  async createRule(dto: CreateCommissionRuleDto) {
    return this.prisma.commissionRule.create({
      data: {
        name: dto.name,
        description: dto.description,
        category: dto.category,
        campaignId: dto.campaignId,
        sellerId: dto.sellerId,
        rate: new Decimal(dto.rate),
        minAmount: new Decimal(dto.minAmount || 0),
        maxAmount: dto.maxAmount ? new Decimal(dto.maxAmount) : null,
        priority: dto.priority || 0,
        validFrom: dto.validFrom ? new Date(dto.validFrom) : new Date(),
        validUntil: dto.validUntil ? new Date(dto.validUntil) : null,
      },
    });
  }

  async updateRule(id: string, dto: UpdateCommissionRuleDto) {
    const rule = await this.prisma.commissionRule.findUnique({ where: { id } });
    if (!rule) throw new NotFoundException('Commission rule not found');

    return this.prisma.commissionRule.update({
      where: { id },
      data: {
        ...dto,
        rate: dto.rate !== undefined ? new Decimal(dto.rate) : undefined,
        minAmount: dto.minAmount !== undefined ? new Decimal(dto.minAmount) : undefined,
        maxAmount: dto.maxAmount !== undefined ? new Decimal(dto.maxAmount) : undefined,
        validFrom: dto.validFrom ? new Date(dto.validFrom) : undefined,
        validUntil: dto.validUntil ? new Date(dto.validUntil) : undefined,
      },
    });
  }

  async deleteRule(id: string) {
    return this.prisma.commissionRule.delete({ where: { id } });
  }

  async getAllRules() {
    return this.prisma.commissionRule.findMany({
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async getActiveRules() {
    const now = new Date();
    return this.prisma.commissionRule.findMany({
      where: {
        isActive: true,
        validFrom: { lte: now },
        OR: [{ validUntil: null }, { validUntil: { gte: now } }],
      },
      orderBy: { priority: 'desc' },
    });
  }

  async getRuleById(id: string) {
    return this.prisma.commissionRule.findUnique({ where: { id } });
  }

  /**
   * Get platform earnings summary.
   */
  async getPlatformEarnings(startDate?: Date, endDate?: Date) {
    const where = {
      userId: PLATFORM_ACCOUNT_ID,
      category: LedgerCategory.PLATFORM_FEE,
      ...(startDate && endDate
        ? {
            createdAt: { gte: startDate, lte: endDate },
          }
        : {}),
    };

    const entries = await this.prisma.ledgerEntry.aggregate({
      where,
      _sum: { amount: true },
      _count: true,
    });

    return {
      totalEarnings: Number(entries._sum.amount || 0),
      transactionCount: entries._count,
    };
  }
}
