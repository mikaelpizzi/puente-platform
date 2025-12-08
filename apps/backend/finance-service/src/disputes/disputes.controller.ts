import { Controller, Get, Post, Patch, Body, Param, Query } from '@nestjs/common';
import { DisputesService } from './disputes.service';
import { CreateDisputeDto } from './dto/create-dispute.dto';
import { ResolveDisputeDto } from './dto/resolve-dispute.dto';

/**
 * Disputes Controller
 *
 * Endpoints for managing disputes.
 */
@Controller('disputes')
export class DisputesController {
  constructor(private readonly disputesService: DisputesService) {}

  /**
   * Open a new dispute (buyer).
   */
  @Post()
  async openDispute(@Body() dto: CreateDisputeDto, @Query('buyerId') buyerId: string) {
    return this.disputesService.openDispute(buyerId, dto);
  }

  /**
   * Get dispute by ID.
   */
  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.disputesService.getById(id);
  }

  /**
   * Get dispute by order ID.
   */
  @Get('order/:orderId')
  async getByOrderId(@Param('orderId') orderId: string) {
    return this.disputesService.getByOrderId(orderId);
  }

  /**
   * Get user's disputes.
   */
  @Get('user/:userId')
  async getByUserId(@Param('userId') userId: string) {
    return this.disputesService.getByUserId(userId);
  }

  /**
   * Get all open disputes (admin).
   */
  @Get('admin/open')
  async getOpenDisputes() {
    return this.disputesService.getOpenDisputes();
  }

  /**
   * Add evidence to dispute (buyer).
   */
  @Patch(':id/evidence')
  async addEvidence(
    @Param('id') id: string,
    @Body() body: { buyerId: string; evidence: string[] },
  ) {
    return this.disputesService.addEvidence(id, body.buyerId, body.evidence);
  }

  /**
   * Start investigation (admin).
   */
  @Patch(':id/investigate')
  async startInvestigation(@Param('id') id: string, @Body() body: { adminId: string }) {
    return this.disputesService.startInvestigation(id, body.adminId);
  }

  /**
   * Resolve dispute (admin).
   */
  @Patch(':id/resolve')
  async resolveDispute(
    @Param('id') id: string,
    @Body() dto: ResolveDisputeDto,
    @Query('adminId') adminId: string,
  ) {
    return this.disputesService.resolveDispute(id, adminId, dto);
  }
}
