import { Module } from '@nestjs/common';
import { WebhookController } from './webhook.controller';
import { FinanceModule } from '../finance/finance.module';

@Module({
  imports: [FinanceModule],
  controllers: [WebhookController],
})
export class WebhookModule {}
