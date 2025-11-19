import { Module } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { FinanceController } from './finance.controller';
import { PaymentModule } from '../payment/payment.module';
import { P2PModule } from '../p2p/p2p.module';

@Module({
  imports: [PaymentModule, P2PModule],
  controllers: [FinanceController],
  providers: [FinanceService],
})
export class FinanceModule {}
