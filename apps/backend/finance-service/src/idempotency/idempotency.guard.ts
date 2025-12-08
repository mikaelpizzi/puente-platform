import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Idempotency Guard for Payment Endpoints
 *
 * Ensures that identical requests with the same Idempotency-Key
 * are not processed twice, preventing duplicate payments.
 *
 * Usage:
 * @UseGuards(IdempotencyGuard)
 * @Post('payments')
 * createPayment(@Body() dto: CreatePaymentDto) { ... }
 */
@Injectable()
export class IdempotencyGuard implements CanActivate {
  private static readonly HEADER_NAME = 'idempotency-key';
  private static readonly KEY_TTL_HOURS = 24;

  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const idempotencyKey = request.headers[IdempotencyGuard.HEADER_NAME];

    // Require idempotency key for POST/PUT/PATCH
    if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
      if (!idempotencyKey) {
        throw new BadRequestException(
          `Idempotency-Key header is required for ${request.method} requests`,
        );
      }

      // Check if key already exists
      const existing = await this.prisma.idempotencyKey.findUnique({
        where: { key: idempotencyKey },
      });

      if (existing) {
        // Key exists - check if it was successful
        if (existing.status === 'COMPLETED') {
          throw new ConflictException({
            message: 'Request already processed',
            idempotencyKey,
            originalResponse: existing.response,
          });
        }

        // Key exists but is still processing (concurrent request)
        if (existing.status === 'PROCESSING') {
          throw new ConflictException({
            message: 'Request is already being processed',
            idempotencyKey,
          });
        }
      }

      // Create new idempotency record
      await this.prisma.idempotencyKey.create({
        data: {
          key: idempotencyKey,
          path: request.path,
          method: request.method,
          status: 'PROCESSING',
          expiresAt: new Date(Date.now() + IdempotencyGuard.KEY_TTL_HOURS * 60 * 60 * 1000),
        },
      });

      // Store key in request for later use
      request.idempotencyKey = idempotencyKey;
    }

    return true;
  }
}

/**
 * Decorator to mark completed idempotent request.
 * Call this after successful processing.
 */
@Injectable()
export class IdempotencyService {
  constructor(private readonly prisma: PrismaService) {}

  async markCompleted(key: string, response: unknown): Promise<void> {
    await this.prisma.idempotencyKey.update({
      where: { key },
      data: {
        status: 'COMPLETED',
        response: JSON.stringify(response),
        completedAt: new Date(),
      },
    });
  }

  async markFailed(key: string, error: string): Promise<void> {
    await this.prisma.idempotencyKey.update({
      where: { key },
      data: {
        status: 'FAILED',
        response: JSON.stringify({ error }),
        completedAt: new Date(),
      },
    });
  }

  /**
   * Clean up expired keys (run as cron job).
   */
  async cleanupExpired(): Promise<number> {
    const result = await this.prisma.idempotencyKey.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });
    return result.count;
  }
}
