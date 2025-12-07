import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { AbstractP2PAdapter } from '../interfaces/p2p-provider.interface';

interface BinanceP2PAdInfo {
  price: string;
  surplusAmount: string;
  minSingleTransAmount: string;
  maxSingleTransAmount: string;
}

interface BinanceP2PResponse {
  data: Array<{
    adv: BinanceP2PAdInfo;
  }>;
}

@Injectable()
export class BinanceAdapter extends AbstractP2PAdapter {
  name = 'BinanceP2P';
  private readonly logger = new Logger(BinanceAdapter.name);
  private readonly apiKey: string;
  private readonly apiSecret: string;
  private readonly baseUrl = 'https://p2p.binance.com';

  constructor(private readonly configService: ConfigService) {
    super();
    this.apiKey = this.configService.get<string>('BINANCE_API_KEY') || '';
    this.apiSecret = this.configService.get<string>('BINANCE_API_SECRET') || '';
  }

  /**
   * Fetches the current USDT exchange rate for a given currency from Binance P2P.
   * Uses the public P2P search endpoint to get the best available rate.
   */
  async getExchangeRate(currency: string): Promise<number> {
    this.logger.log(`Fetching USDT/${currency} rate from Binance P2P...`);

    try {
      // Binance P2P API - Get best sell prices (we want to sell USDT for fiat)
      const response = await fetch(`${this.baseUrl}/bapi/c2c/v2/friendly/c2c/adv/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fiat: currency.toUpperCase(),
          page: 1,
          rows: 10,
          tradeType: 'SELL', // Selling USDT
          asset: 'USDT',
          countries: [],
          proMerchantAds: false,
          publisherType: null,
          payTypes: [],
        }),
      });

      if (!response.ok) {
        throw new Error(`Binance P2P API error: ${response.status}`);
      }

      const data: BinanceP2PResponse = await response.json();

      if (!data.data || data.data.length === 0) {
        this.logger.warn(`No P2P ads found for USDT/${currency}`);
        throw new Error(`No P2P ads available for ${currency}`);
      }

      // Get the best (first) price
      const bestPrice = parseFloat(data.data[0].adv.price);
      this.logger.log(`USDT/${currency} rate: ${bestPrice}`);

      return bestPrice;
    } catch (error) {
      this.logger.error(`Failed to fetch Binance P2P rate: ${error}`);
      throw error;
    }
  }

  /**
   * Creates a signature for authenticated Binance API requests.
   */
  private createSignature(queryString: string): string {
    return crypto.createHmac('sha256', this.apiSecret).update(queryString).digest('hex');
  }

  /**
   * Creates a sell order on Binance P2P.
   * Note: This is a simplified implementation. Real P2P trading requires
   * manual confirmation by both parties.
   */
  async createSellOrder(
    amount: number,
    currency: string,
  ): Promise<{ orderId: string; paymentDetails: Record<string, string> }> {
    this.logger.log(`Creating sell order for ${amount} USDT in ${currency} on Binance P2P...`);

    // For now, return a mock order ID since P2P trading requires
    // interactive flow (posting ad, waiting for buyer, confirming payment)
    // Real implementation would use Binance P2P merchant API
    const orderId = `binance_p2p_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    return {
      orderId,
      paymentDetails: {
        status: 'PENDING_AD_POST',
        amount: amount.toString(),
        currency,
        message: 'P2P order created. Waiting for buyer.',
      },
    };
  }

  /**
   * Checks the status of a P2P order.
   */
  async checkOrderStatus(orderId: string): Promise<'PENDING' | 'COMPLETED' | 'FAILED'> {
    this.logger.log(`Checking status for order ${orderId} on Binance P2P...`);
    // Real implementation would query Binance P2P API for order status
    return 'PENDING';
  }
}
