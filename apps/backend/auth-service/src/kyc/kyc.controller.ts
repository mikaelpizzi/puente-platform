import { Controller, Get, Post, Patch, Body, Param, Query } from '@nestjs/common';
import { KycService } from './kyc.service';
import { KycDocumentType } from '@prisma/auth-client';

/**
 * KYC Controller
 *
 * Endpoints for document upload and verification.
 */
@Controller('kyc')
export class KycController {
  constructor(private readonly kycService: KycService) {}

  /**
   * Upload a KYC document.
   */
  @Post('upload')
  async uploadDocument(
    @Body()
    body: {
      userId: string;
      type: KycDocumentType;
      fileUrl: string;
      fileName: string;
      fileSize: number;
      mimeType: string;
    },
  ) {
    return this.kycService.uploadDocument(body.userId, {
      type: body.type,
      fileUrl: body.fileUrl,
      fileName: body.fileName,
      fileSize: body.fileSize,
      mimeType: body.mimeType,
    });
  }

  /**
   * Get user's KYC status.
   */
  @Get('status/:userId')
  async getUserStatus(@Param('userId') userId: string) {
    return this.kycService.getUserKycStatus(userId);
  }

  /**
   * Get user's documents.
   */
  @Get('documents/:userId')
  async getUserDocuments(@Param('userId') userId: string) {
    return this.kycService.getUserDocuments(userId);
  }

  /**
   * Get pending documents (admin).
   */
  @Get('admin/pending')
  async getPendingDocuments() {
    return this.kycService.getPendingDocuments();
  }

  /**
   * Approve document (admin).
   */
  @Patch(':documentId/approve')
  async approveDocument(
    @Param('documentId') documentId: string,
    @Body() body: { adminId: string; notes?: string },
  ) {
    return this.kycService.approveDocument(documentId, body.adminId, body.notes);
  }

  /**
   * Reject document (admin).
   */
  @Patch(':documentId/reject')
  async rejectDocument(
    @Param('documentId') documentId: string,
    @Body() body: { adminId: string; notes: string },
  ) {
    return this.kycService.rejectDocument(documentId, body.adminId, body.notes);
  }
}
