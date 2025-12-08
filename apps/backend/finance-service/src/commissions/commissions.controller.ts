import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { CommissionsService } from './commissions.service';
import { CreateCommissionRuleDto } from './dto/create-rule.dto';
import { UpdateCommissionRuleDto } from './dto/update-rule.dto';

/**
 * Commissions Controller
 *
 * Admin endpoints for managing commission rules and viewing earnings.
 */
@Controller('commissions')
export class CommissionsController {
  constructor(private readonly commissionsService: CommissionsService) {}

  // ==================== Commission Calculation ====================

  /**
   * Calculate commission for a given amount.
   */
  @Post('calculate')
  async calculateCommission(
    @Body() body: { amount: number; category?: string; campaignId?: string; sellerId?: string },
  ) {
    return this.commissionsService.calculateCommission(body.amount, {
      category: body.category,
      campaignId: body.campaignId,
      sellerId: body.sellerId,
    });
  }

  /**
   * Apply commission split (creates ledger entries).
   */
  @Post('apply')
  async applyCommission(
    @Body()
    body: {
      orderId: string;
      sellerId: string;
      amount: number;
      category?: string;
      campaignId?: string;
    },
  ) {
    return this.commissionsService.applyCommissionSplit(body.orderId, body.sellerId, body.amount, {
      category: body.category,
      campaignId: body.campaignId,
    });
  }

  // ==================== Commission Rules CRUD ====================

  /**
   * Get all commission rules (admin).
   */
  @Get('rules')
  async getAllRules() {
    return this.commissionsService.getAllRules();
  }

  /**
   * Get active commission rules.
   */
  @Get('rules/active')
  async getActiveRules() {
    return this.commissionsService.getActiveRules();
  }

  /**
   * Get a specific rule.
   */
  @Get('rules/:id')
  async getRule(@Param('id') id: string) {
    return this.commissionsService.getRuleById(id);
  }

  /**
   * Create a new commission rule (admin).
   */
  @Post('rules')
  async createRule(@Body() dto: CreateCommissionRuleDto) {
    return this.commissionsService.createRule(dto);
  }

  /**
   * Update a commission rule (admin).
   */
  @Patch('rules/:id')
  async updateRule(@Param('id') id: string, @Body() dto: UpdateCommissionRuleDto) {
    return this.commissionsService.updateRule(id, dto);
  }

  /**
   * Delete a commission rule (admin).
   */
  @Delete('rules/:id')
  async deleteRule(@Param('id') id: string) {
    return this.commissionsService.deleteRule(id);
  }

  // ==================== Platform Earnings ====================

  /**
   * Get platform earnings summary (admin).
   */
  @Get('earnings')
  async getPlatformEarnings(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.commissionsService.getPlatformEarnings(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }
}
