import { Module } from '@nestjs/common';
import { IdempotencyGuard, IdempotencyService } from './idempotency.guard';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [IdempotencyGuard, IdempotencyService],
  exports: [IdempotencyGuard, IdempotencyService],
})
export class IdempotencyModule {}
