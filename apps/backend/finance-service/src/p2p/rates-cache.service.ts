import { Injectable, Logger, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export interface CachedRate {
  rate: number;
  source: string;
  fetchedAt: string;
}

@Injectable()
export class RatesCacheService {
  private readonly logger = new Logger(RatesCacheService.name);
  private readonly keyPrefix = 'rates:usdt';
  private readonly cacheTtlSeconds: number;

  constructor(
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
    private readonly configService: ConfigService,
  ) {
    this.cacheTtlSeconds = Number(this.configService.get('RATES_CACHE_TTL_SECONDS') || 60);
  }

  /**
   * Gets a cached exchange rate if available and not expired.
   */
  async getCachedRate(currency: string): Promise<CachedRate | null> {
    const key = this.getKey(currency);
    const cached = await this.redis.get(key);

    if (!cached) {
      this.logger.debug(`Cache miss for ${currency}`);
      return null;
    }

    try {
      const data: CachedRate = JSON.parse(cached);
      this.logger.debug(`Cache hit for ${currency}: ${data.rate} from ${data.source}`);
      return data;
    } catch {
      this.logger.warn(`Invalid cache data for ${currency}`);
      return null;
    }
  }

  /**
   * Caches an exchange rate with TTL.
   */
  async setCachedRate(currency: string, rate: number, source: string): Promise<void> {
    const key = this.getKey(currency);
    const data: CachedRate = {
      rate,
      source,
      fetchedAt: new Date().toISOString(),
    };

    await this.redis.setex(key, this.cacheTtlSeconds, JSON.stringify(data));
    this.logger.debug(
      `Cached ${currency} rate: ${rate} from ${source} (TTL: ${this.cacheTtlSeconds}s)`,
    );
  }

  /**
   * Invalidates a cached rate.
   */
  async invalidate(currency: string): Promise<void> {
    const key = this.getKey(currency);
    await this.redis.del(key);
    this.logger.debug(`Invalidated cache for ${currency}`);
  }

  private getKey(currency: string): string {
    return `${this.keyPrefix}:${currency.toLowerCase()}`;
  }
}
