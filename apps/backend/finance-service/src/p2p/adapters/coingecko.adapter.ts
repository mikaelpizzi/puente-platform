import { Injectable, Logger } from '@nestjs/common';
import { AbstractP2PAdapter } from '../interfaces/p2p-provider.interface';

interface CoinGeckoSimplePrice {
  [coinId: string]: {
    [vsCurrency: string]: number;
  };
}

@Injectable()
export class CoinGeckoAdapter extends AbstractP2PAdapter {
  name = 'CoinGecko';
  private readonly logger = new Logger(CoinGeckoAdapter.name);
  private readonly baseUrl = 'https://api.coingecko.com/api/v3';

  /**
   * Fetches the current USDT exchange rate for a given currency from CoinGecko.
   * CoinGecko is used as a fallback when Binance P2P is unavailable.
   */
  async getExchangeRate(currency: string): Promise<number> {
    this.logger.log(`Fetching USDT/${currency} rate from CoinGecko...`);

    try {
      // Convert currency to CoinGecko format (lowercase)
      const vsCurrency = currency.toLowerCase();

      const response = await fetch(
        `${this.baseUrl}/simple/price?ids=tether&vs_currencies=${vsCurrency}`,
      );

      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status}`);
      }

      const data: CoinGeckoSimplePrice = await response.json();

      if (!data.tether || !data.tether[vsCurrency]) {
        throw new Error(`No rate found for USDT/${currency}`);
      }

      const rate = data.tether[vsCurrency];
      this.logger.log(`USDT/${currency} rate from CoinGecko: ${rate}`);

      return rate;
    } catch (error) {
      this.logger.error(`Failed to fetch CoinGecko rate: ${error}`);
      throw error;
    }
  }

  /**
   * CoinGecko is a price API only - it doesn't support trading.
   * This method throws an error indicating that trading is not supported.
   */
  async createSellOrder(
    _amount: number,
    _currency: string,
  ): Promise<{ orderId: string; paymentDetails: Record<string, string> }> {
    throw new Error('CoinGecko does not support trading. Use Binance P2P for orders.');
  }

  /**
   * CoinGecko doesn't have orders.
   */
  async checkOrderStatus(_orderId: string): Promise<'PENDING' | 'COMPLETED' | 'FAILED'> {
    throw new Error('CoinGecko does not support trading orders.');
  }
}
