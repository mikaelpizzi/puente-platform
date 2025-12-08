import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { EscrowService } from './escrow.service';

/**
 * Escrow Controller
 *
 * Endpoints for managing escrow funds.
 */
@Controller('escrow')
export class EscrowController {
  constructor(private readonly escrowService: EscrowService) {}

  /**
   * Create escrow for an order (internal/payment webhook).
   */
  @Post()
  async createEscrow(
    @Body() body: { orderId: string; amount: number; sellerId: string; buyerId: string },
  ) {
    return this.escrowService.createEscrow(body.orderId, body.amount, body.sellerId, body.buyerId);
  }

  /**
   * Get escrow by order ID.
   */
  @Get('order/:orderId')
  async getByOrderId(@Param('orderId') orderId: string) {
    return this.escrowService.getByOrderId(orderId);
  }

  /**
   * Get all escrows for a user.
   */
  @Get('user/:userId')
  async getByUserId(
    @Param('userId') userId: string,
    @Query('role') role: 'buyer' | 'seller' = 'buyer',
  ) {
    return this.escrowService.getByUserId(userId, role);
  }

  /**
   * Get pending escrows (admin only).
   */
  @Get('admin/pending')
  async getPendingEscrows() {
    return this.escrowService.getPendingEscrows();
  }

  /**
   * Release escrow to seller (admin only).
   */
  @Post(':escrowId/release-seller')
  async releaseToSeller(
    @Param('escrowId') escrowId: string,
    @Body() body: { adminId: string; note?: string },
  ) {
    return this.escrowService.releaseToSeller(escrowId, body.adminId, body.note);
  }

  /**
   * Release escrow to buyer (admin only, dispute resolution).
   */
  @Post(':escrowId/release-buyer')
  async releaseToBuyer(
    @Param('escrowId') escrowId: string,
    @Body() body: { adminId: string; note?: string },
  ) {
    return this.escrowService.releaseToBuyer(escrowId, body.adminId, body.note);
  }
}
