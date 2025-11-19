import { Module } from '@nestjs/common';
import { P2PService } from './p2p.service';
import { MockBinanceAdapter } from './adapters/mock-binance.adapter';
import { AbstractP2PAdapter } from './interfaces/p2p-provider.interface';

@Module({
  providers: [
    P2PService,
    MockBinanceAdapter,
    {
      provide: AbstractP2PAdapter,
      useClass: MockBinanceAdapter, // Default adapter
    },
  ],
  exports: [P2PService],
})
export class P2PModule {}
