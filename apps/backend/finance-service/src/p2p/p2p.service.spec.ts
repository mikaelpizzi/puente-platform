import { Test, TestingModule } from '@nestjs/testing';
import { P2PService } from './p2p.service';
import { AbstractP2PAdapter } from './interfaces/p2p-provider.interface';
import { MockBinanceAdapter } from './adapters/mock-binance.adapter';

describe('P2PService', () => {
  let service: P2PService;
  let defaultAdapter: AbstractP2PAdapter;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        P2PService,
        {
          provide: AbstractP2PAdapter,
          useClass: MockBinanceAdapter,
        },
      ],
    }).compile();

    service = module.get<P2PService>(P2PService);
    defaultAdapter = module.get<AbstractP2PAdapter>(AbstractP2PAdapter);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should use the default adapter if no name is provided', async () => {
    const spy = vi.spyOn(defaultAdapter, 'getExchangeRate');
    await service.getUSDTQuote('ARS');
    expect(spy).toHaveBeenCalledWith('ARS');
  });

  it('should return a quote from the adapter', async () => {
    const rate = await service.getUSDTQuote('ARS');
    expect(rate).toBe(1000); // Mock value
  });

  it('should initiate a sell order', async () => {
    const result = await service.initiateUSDTConversion(100, 'ARS');
    expect(result).toHaveProperty('orderId');
    expect(result.orderId).toContain('binance_');
  });

  it('should fallback to default adapter if requested adapter not found', async () => {
    const spy = vi.spyOn(defaultAdapter, 'getExchangeRate');
    await service.getUSDTQuote('ARS', 'NonExistentAdapter');
    expect(spy).toHaveBeenCalledWith('ARS');
  });
});
