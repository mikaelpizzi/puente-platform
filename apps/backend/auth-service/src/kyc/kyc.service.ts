import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { KycStatus, KycDocumentType, AuditAction } from '@prisma/auth-client';
import { AuditService } from '../audit/audit.service';

/**
 * KYC Service
 *
 * Handles document upload and verification workflow.
 */
@Injectable()
export class KycService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Upload a KYC document.
   */
  async uploadDocument(
    userId: string,
    data: {
      type: KycDocumentType;
      fileUrl: string;
      fileName: string;
      fileSize: number;
      mimeType: string;
    },
  ) {
    const document = await this.prisma.kycDocument.create({
      data: {
        userId,
        type: data.type,
        fileUrl: data.fileUrl,
        fileName: data.fileName,
        fileSize: data.fileSize,
        mimeType: data.mimeType,
        status: KycStatus.PENDING,
      },
    });

    // Log the upload
    await this.auditService.log({
      actorId: userId,
      action: AuditAction.KYC_SUBMIT,
      resource: 'kyc_document',
      resourceId: document.id,
      afterData: { type: data.type, fileName: data.fileName },
    });

    return document;
  }

  /**
   * Approve a KYC document (admin).
   */
  async approveDocument(documentId: string, adminId: string, notes?: string) {
    const doc = await this.prisma.kycDocument.findUnique({ where: { id: documentId } });
    if (!doc) throw new NotFoundException('Document not found');
    if (doc.status !== KycStatus.PENDING) {
      throw new BadRequestException('Document is not pending review');
    }

    const updated = await this.prisma.kycDocument.update({
      where: { id: documentId },
      data: {
        status: KycStatus.VERIFIED,
        reviewedBy: adminId,
        reviewedAt: new Date(),
        reviewNotes: notes,
      },
    });

    await this.auditService.log({
      actorId: adminId,
      action: AuditAction.KYC_APPROVE,
      resource: 'kyc_document',
      resourceId: documentId,
      beforeData: { status: doc.status },
      afterData: { status: KycStatus.VERIFIED, notes },
    });

    return updated;
  }

  /**
   * Reject a KYC document (admin).
   */
  async rejectDocument(documentId: string, adminId: string, notes: string) {
    const doc = await this.prisma.kycDocument.findUnique({ where: { id: documentId } });
    if (!doc) throw new NotFoundException('Document not found');
    if (doc.status !== KycStatus.PENDING) {
      throw new BadRequestException('Document is not pending review');
    }

    const updated = await this.prisma.kycDocument.update({
      where: { id: documentId },
      data: {
        status: KycStatus.REJECTED,
        reviewedBy: adminId,
        reviewedAt: new Date(),
        reviewNotes: notes,
      },
    });

    await this.auditService.log({
      actorId: adminId,
      action: AuditAction.KYC_REJECT,
      resource: 'kyc_document',
      resourceId: documentId,
      beforeData: { status: doc.status },
      afterData: { status: KycStatus.REJECTED, notes },
    });

    return updated;
  }

  /**
   * Get user's KYC documents.
   */
  async getUserDocuments(userId: string) {
    return this.prisma.kycDocument.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get user's KYC status (aggregated).
   */
  async getUserKycStatus(userId: string) {
    const documents = await this.getUserDocuments(userId);

    if (documents.length === 0) {
      return { status: KycStatus.UNVERIFIED, documents: [] };
    }

    const allVerified = documents.every((d) => d.status === KycStatus.VERIFIED);
    const anyPending = documents.some((d) => d.status === KycStatus.PENDING);

    return {
      status: allVerified
        ? KycStatus.VERIFIED
        : anyPending
          ? KycStatus.PENDING
          : KycStatus.UNVERIFIED,
      documents,
    };
  }

  /**
   * Get pending documents (admin view).
   */
  async getPendingDocuments() {
    return this.prisma.kycDocument.findMany({
      where: { status: KycStatus.PENDING },
      include: { user: { select: { id: true, email: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }
}
