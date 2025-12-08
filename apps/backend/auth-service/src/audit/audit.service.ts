import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditAction } from '@prisma/auth-client';

interface AuditLogData {
  actorId: string;
  action: AuditAction;
  resource: string;
  resourceId: string;
  beforeData?: unknown;
  afterData?: unknown;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Audit Service
 *
 * Logs all sensitive changes with who/when/what.
 */
@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create an audit log entry.
   */
  async log(data: AuditLogData) {
    return this.prisma.auditLog.create({
      data: {
        actorId: data.actorId,
        action: data.action,
        resource: data.resource,
        resourceId: data.resourceId,
        beforeData: data.beforeData ? JSON.stringify(data.beforeData) : null,
        afterData: data.afterData ? JSON.stringify(data.afterData) : null,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    });
  }

  /**
   * Get audit logs for a specific resource.
   */
  async getResourceLogs(resource: string, resourceId: string) {
    return this.prisma.auditLog.findMany({
      where: { resource, resourceId },
      include: { actor: { select: { id: true, email: true, role: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get audit logs by actor.
   */
  async getActorLogs(actorId: string, limit = 50) {
    return this.prisma.auditLog.findMany({
      where: { actorId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Get recent audit logs (admin view).
   */
  async getRecentLogs(limit = 100, action?: AuditAction) {
    return this.prisma.auditLog.findMany({
      where: action ? { action } : undefined,
      include: { actor: { select: { id: true, email: true, role: true } } },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Search audit logs.
   */
  async searchLogs(params: {
    actorId?: string;
    action?: AuditAction;
    resource?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }) {
    return this.prisma.auditLog.findMany({
      where: {
        ...(params.actorId && { actorId: params.actorId }),
        ...(params.action && { action: params.action }),
        ...(params.resource && { resource: params.resource }),
        ...(params.startDate &&
          params.endDate && {
            createdAt: { gte: params.startDate, lte: params.endDate },
          }),
      },
      include: { actor: { select: { id: true, email: true, role: true } } },
      orderBy: { createdAt: 'desc' },
      take: params.limit || 100,
    });
  }
}
