import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { P2PService } from './p2p.service';
import { BinanceAdapter } from './adapters/binance.adapter';
import { CoinGeckoAdapter } from './adapters/coingecko.adapter';
import { MockBinanceAdapter } from './adapters/mock-binance.adapter';
import { RatesCacheService } from './rates-cache.service';
import { AbstractP2PAdapter } from './interfaces/p2p-provider.interface';

@Module({
  imports: [ConfigModule],
  providers: [
    P2PService,
    BinanceAdapter,
    CoinGeckoAdapter,
    MockBinanceAdapter,
    RatesCacheService,
    {
      provide: 'REDIS_CLIENT',
      useFactory: (configService: ConfigService) => {
        const redisUrl = configService.get('REDIS_URL') || 'redis://localhost:6379';
        return new Redis(redisUrl);
      },
      inject: [ConfigService],
    },
    {
      provide: AbstractP2PAdapter,
      useClass: BinanceAdapter, // Primary adapter (real API)
    },
    {
      provide: 'FALLBACK_ADAPTER',
      useClass: CoinGeckoAdapter, // Fallback when Binance fails
    },
  ],
  exports: [P2PService, RatesCacheService],
})
export class P2PModule {}
