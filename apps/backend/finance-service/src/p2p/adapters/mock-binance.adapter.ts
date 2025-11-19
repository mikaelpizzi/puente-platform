import { Injectable, Logger } from '@nestjs/common';
import { AbstractP2PAdapter } from '../interfaces/p2p-provider.interface';

@Injectable()
export class MockBinanceAdapter extends AbstractP2PAdapter {
  name = 'BinanceP2P';
  private readonly logger = new Logger(MockBinanceAdapter.name);

  async getExchangeRate(currency: string): Promise<number> {
    this.logger.log(`Fetching USDT/${currency} rate from Binance...`);
    // Mock rate: 1 USDT = 1000 ARS (example)
    return 1000;
  }

  async createSellOrder(
    amount: number,
    currency: string,
  ): Promise<{ orderId: string; paymentDetails: any }> {
    this.logger.log(`Creating sell order for ${amount} USDT in ${currency} on Binance...`);
    return {
      orderId: `binance_${Date.now()}`,
      paymentDetails: {
        bank: 'Mercado Pago',
        account: '1234567890',
        cbu: '0000000000000000000000',
      },
    };
  }

  async checkOrderStatus(orderId: string): Promise<'PENDING' | 'COMPLETED' | 'FAILED'> {
    this.logger.log(`Checking status for order ${orderId} on Binance...`);
    // Mock random status for testing
    return 'COMPLETED';
  }
}
