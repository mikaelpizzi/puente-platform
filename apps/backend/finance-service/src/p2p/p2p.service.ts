import { Injectable, Logger, Inject, Optional } from '@nestjs/common';
import { AbstractP2PAdapter } from './interfaces/p2p-provider.interface';
import { RatesCacheService, CachedRate } from './rates-cache.service';

export interface RateResult {
  rate: number;
  source: string;
  cached: boolean;
  fetchedAt: string;
}

@Injectable()
export class P2PService {
  private readonly logger = new Logger(P2PService.name);
  private adapters: Map<string, AbstractP2PAdapter> = new Map();

  constructor(
    private readonly primaryAdapter: AbstractP2PAdapter,
    @Optional() @Inject('FALLBACK_ADAPTER') private readonly fallbackAdapter?: AbstractP2PAdapter,
    @Optional() private readonly cacheService?: RatesCacheService,
  ) {
    this.registerAdapter(primaryAdapter);
    if (fallbackAdapter) {
      this.registerAdapter(fallbackAdapter);
    }
  }

  registerAdapter(adapter: AbstractP2PAdapter): void {
    this.adapters.set(adapter.name, adapter);
    this.logger.log(`Registered P2P Adapter: ${adapter.name}`);
  }

  /**
   * Gets USDT exchange rate with caching and fallback support.
   * 1. Check Redis cache
   * 2. Try primary adapter (Binance)
   * 3. Fallback to secondary adapter (CoinGecko)
   */
  async getUSDTQuote(currency: string, providerName?: string): Promise<RateResult> {
    const normalizedCurrency = currency.toUpperCase();

    // 1. Check cache first
    if (this.cacheService) {
      const cached = await this.cacheService.getCachedRate(normalizedCurrency);
      if (cached) {
        return {
          rate: cached.rate,
          source: cached.source,
          cached: true,
          fetchedAt: cached.fetchedAt,
        };
      }
    }

    // 2. Try specified or primary adapter
    const adapter = this.getAdapter(providerName);

    try {
      const rate = await adapter.getExchangeRate(normalizedCurrency);

      // Cache the result
      if (this.cacheService) {
        await this.cacheService.setCachedRate(normalizedCurrency, rate, adapter.name);
      }

      return {
        rate,
        source: adapter.name,
        cached: false,
        fetchedAt: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.warn(`Primary adapter ${adapter.name} failed: ${error}`);

      // 3. Try fallback adapter
      if (this.fallbackAdapter && adapter.name !== this.fallbackAdapter.name) {
        this.logger.log(`Trying fallback adapter: ${this.fallbackAdapter.name}`);

        try {
          const rate = await this.fallbackAdapter.getExchangeRate(normalizedCurrency);

          // Cache the result
          if (this.cacheService) {
            await this.cacheService.setCachedRate(
              normalizedCurrency,
              rate,
              this.fallbackAdapter.name,
            );
          }

          return {
            rate,
            source: this.fallbackAdapter.name,
            cached: false,
            fetchedAt: new Date().toISOString(),
          };
        } catch (fallbackError) {
          this.logger.error(`Fallback adapter also failed: ${fallbackError}`);
          throw fallbackError;
        }
      }

      throw error;
    }
  }

  /**
   * Initiates a USDT conversion order.
   */
  async initiateUSDTConversion(
    amount: number,
    currency: string,
    providerName?: string,
  ): Promise<{ orderId: string; paymentDetails: Record<string, string> }> {
    const adapter = this.getAdapter(providerName);
    return adapter.createSellOrder(amount, currency);
  }

  /**
   * Gets the status of an existing order.
   */
  async getOrderStatus(
    orderId: string,
    providerName?: string,
  ): Promise<'PENDING' | 'COMPLETED' | 'FAILED'> {
    const adapter = this.getAdapter(providerName);
    return adapter.checkOrderStatus(orderId);
  }

  private getAdapter(name?: string): AbstractP2PAdapter {
    if (name && this.adapters.has(name)) {
      return this.adapters.get(name)!;
    }
    return this.primaryAdapter;
  }
}
