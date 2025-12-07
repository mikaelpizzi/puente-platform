import { Test, TestingModule } from '@nestjs/testing';
import { vi, describe, it, expect, beforeEach, Mock } from 'vitest';
import { P2PService, RateResult } from './p2p.service';
import { AbstractP2PAdapter } from './interfaces/p2p-provider.interface';
import { RatesCacheService, CachedRate } from './rates-cache.service';

// Mock primary adapter
class MockPrimaryAdapter extends AbstractP2PAdapter {
  name = 'MockPrimary';
  getExchangeRate = vi.fn();
  createSellOrder = vi.fn();
  checkOrderStatus = vi.fn();
}

// Mock fallback adapter
class MockFallbackAdapter extends AbstractP2PAdapter {
  name = 'MockFallback';
  getExchangeRate = vi.fn();
  createSellOrder = vi.fn();
  checkOrderStatus = vi.fn();
}

describe('P2PService', () => {
  let service: P2PService;
  let primaryAdapter: MockPrimaryAdapter;
  let fallbackAdapter: MockFallbackAdapter;
  let cacheService: {
    getCachedRate: Mock;
    setCachedRate: Mock;
  };

  beforeEach(async () => {
    primaryAdapter = new MockPrimaryAdapter();
    fallbackAdapter = new MockFallbackAdapter();
    cacheService = {
      getCachedRate: vi.fn(),
      setCachedRate: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: P2PService,
          useFactory: () =>
            new P2PService(
              primaryAdapter,
              fallbackAdapter,
              cacheService as unknown as RatesCacheService,
            ),
        },
      ],
    }).compile();

    service = module.get<P2PService>(P2PService);
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getUSDTQuote', () => {
    it('should return cached rate if available', async () => {
      const cachedRate: CachedRate = {
        rate: 3800,
        source: 'BinanceP2P',
        fetchedAt: '2025-12-07T10:00:00Z',
      };
      cacheService.getCachedRate.mockResolvedValue(cachedRate);

      const result = await service.getUSDTQuote('PEN');

      expect(result.rate).toBe(3800);
      expect(result.cached).toBe(true);
      expect(result.source).toBe('BinanceP2P');
      expect(primaryAdapter.getExchangeRate).not.toHaveBeenCalled();
    });

    it('should fetch from primary adapter on cache miss', async () => {
      cacheService.getCachedRate.mockResolvedValue(null);
      primaryAdapter.getExchangeRate.mockResolvedValue(3850);

      const result = await service.getUSDTQuote('PEN');

      expect(result.rate).toBe(3850);
      expect(result.cached).toBe(false);
      expect(result.source).toBe('MockPrimary');
      expect(cacheService.setCachedRate).toHaveBeenCalledWith('PEN', 3850, 'MockPrimary');
    });

    it('should fallback to secondary adapter when primary fails', async () => {
      cacheService.getCachedRate.mockResolvedValue(null);
      primaryAdapter.getExchangeRate.mockRejectedValue(new Error('Binance API down'));
      fallbackAdapter.getExchangeRate.mockResolvedValue(3800);

      const result = await service.getUSDTQuote('PEN');

      expect(result.rate).toBe(3800);
      expect(result.source).toBe('MockFallback');
      expect(cacheService.setCachedRate).toHaveBeenCalledWith('PEN', 3800, 'MockFallback');
    });

    it('should throw when both adapters fail', async () => {
      cacheService.getCachedRate.mockResolvedValue(null);
      primaryAdapter.getExchangeRate.mockRejectedValue(new Error('Binance down'));
      fallbackAdapter.getExchangeRate.mockRejectedValue(new Error('CoinGecko down'));

      await expect(service.getUSDTQuote('PEN')).rejects.toThrow('CoinGecko down');
    });

    it('should normalize currency to uppercase', async () => {
      cacheService.getCachedRate.mockResolvedValue(null);
      primaryAdapter.getExchangeRate.mockResolvedValue(3850);

      await service.getUSDTQuote('pen');

      expect(primaryAdapter.getExchangeRate).toHaveBeenCalledWith('PEN');
    });
  });

  describe('initiateUSDTConversion', () => {
    it('should create sell order via primary adapter', async () => {
      const mockOrder = { orderId: 'test-123', paymentDetails: { bank: 'Test' } };
      primaryAdapter.createSellOrder.mockResolvedValue(mockOrder);

      const result = await service.initiateUSDTConversion(100, 'PEN');

      expect(result).toEqual(mockOrder);
      expect(primaryAdapter.createSellOrder).toHaveBeenCalledWith(100, 'PEN');
    });
  });

  describe('getOrderStatus', () => {
    it('should check order status via primary adapter', async () => {
      primaryAdapter.checkOrderStatus.mockResolvedValue('COMPLETED');

      const result = await service.getOrderStatus('test-123');

      expect(result).toBe('COMPLETED');
      expect(primaryAdapter.checkOrderStatus).toHaveBeenCalledWith('test-123');
    });
  });
});
