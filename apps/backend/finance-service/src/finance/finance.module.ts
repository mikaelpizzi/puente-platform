import { Module } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { FinanceController } from './finance.controller';
import { PaymentModule } from '../payment/payment.module';
import { P2PModule } from '../p2p/p2p.module';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [PaymentModule, P2PModule, EventsModule],
  controllers: [FinanceController],
  providers: [FinanceService],
  exports: [FinanceService],
})
export class FinanceModule {}
