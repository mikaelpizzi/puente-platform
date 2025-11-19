import { Injectable, Logger } from '@nestjs/common';
import { AbstractP2PAdapter } from './interfaces/p2p-provider.interface';

@Injectable()
export class P2PService {
  private readonly logger = new Logger(P2PService.name);
  private adapters: Map<string, AbstractP2PAdapter> = new Map();

  constructor(private readonly defaultAdapter: AbstractP2PAdapter) {
    this.registerAdapter(defaultAdapter);
  }

  registerAdapter(adapter: AbstractP2PAdapter) {
    this.adapters.set(adapter.name, adapter);
    this.logger.log(`Registered P2P Adapter: ${adapter.name}`);
  }

  async getUSDTQuote(currency: string, providerName?: string): Promise<number> {
    const adapter = this.getAdapter(providerName);
    return adapter.getExchangeRate(currency);
  }

  async initiateUSDTConversion(amount: number, currency: string, providerName?: string) {
    const adapter = this.getAdapter(providerName);
    return adapter.createSellOrder(amount, currency);
  }

  private getAdapter(name?: string): AbstractP2PAdapter {
    if (name && this.adapters.has(name)) {
      return this.adapters.get(name)!;
    }
    return this.defaultAdapter;
  }
}
