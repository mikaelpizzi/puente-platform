import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { LogisticsService } from './logistics.service';
import { MetricsService } from '../metrics/metrics.service';

const createRedisMock = () => ({
  geoadd: vi.fn().mockResolvedValue(1),
  georadius: vi.fn(),
  publish: vi.fn().mockResolvedValue(1),
  lpush: vi.fn().mockResolvedValue(1),
  ltrim: vi.fn().mockResolvedValue(1),
  expire: vi.fn().mockResolvedValue(1),
  zremrangebyscore: vi.fn().mockResolvedValue(0),
  zcard: vi.fn().mockResolvedValue(0),
  zadd: vi.fn().mockResolvedValue(1),
  pexpire: vi.fn().mockResolvedValue(1),
});

const configMock = {
  get: vi.fn((key: string) => {
    const map: Record<string, number> = {
      LOGISTICS_HISTORY_SIZE: 3,
      LOGISTICS_HISTORY_TTL_SECONDS: 60,
      LOGISTICS_THROTTLE_WINDOW_MS: 1000,
      LOGISTICS_THROTTLE_MAX_EVENTS: 2,
    };
    return map[key];
  }),
};

const metricsMock = {
  observeIngest: vi.fn(),
  incrementThrottled: vi.fn(),
};

describe('LogisticsService', () => {
  let service: LogisticsService;
  let mockRedis: ReturnType<typeof createRedisMock>;

  beforeEach(async () => {
    mockRedis = createRedisMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LogisticsService,
        {
          provide: 'REDIS_CLIENT',
          useValue: mockRedis,
        },
        {
          provide: ConfigService,
          useValue: configMock,
        },
        {
          provide: MetricsService,
          useValue: metricsMock,
        },
      ],
    }).compile();

    service = module.get<LogisticsService>(LogisticsService);
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should update driver location and publish event', async () => {
    const driverId = 'driver1';
    const lat = -34.6037;
    const lng = -58.3816;

    await service.updateDriverLocation(driverId, lat, lng);

    expect(mockRedis.geoadd).toHaveBeenCalledWith('drivers:locations', lng, lat, driverId);
    expect(mockRedis.lpush).toHaveBeenCalledTimes(1);
    expect(mockRedis.ltrim).toHaveBeenCalledWith(expect.any(String), 0, 2);
    expect(mockRedis.expire).toHaveBeenCalledWith(expect.any(String), 60);
    expect(mockRedis.publish).toHaveBeenCalledWith(
      'driver.location.updated',
      JSON.stringify({ driverId, lat, lng }),
    );
    expect(metricsMock.observeIngest).toHaveBeenCalledWith('rest', expect.any(Number));
  });

  it('should find nearby drivers', async () => {
    const lat = -34.6037;
    const lng = -58.3816;
    const radius = 5;

    // Mock Redis response for GEORADIUS
    // [member, distance, [lng, lat]]
    const mockResponse = [
      ['driver1', '1.2', ['-58.3820', '-34.6040']],
      ['driver2', '3.5', ['-58.3900', '-34.6100']],
    ];
    mockRedis.georadius.mockResolvedValue(mockResponse);

    const result = await service.getNearbyDrivers(lat, lng, radius);

    expect(mockRedis.georadius).toHaveBeenCalledWith(
      'drivers:locations',
      lng,
      lat,
      radius,
      'km',
      'WITHDIST',
      'WITHCOORD',
    );

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      driverId: 'driver1',
      distance: '1.2',
      coordinates: { lng: '-58.3820', lat: '-34.6040' },
    });
  });

  it('should throttle rapid updates from the same driver', async () => {
    mockRedis.zcard.mockResolvedValueOnce(0).mockResolvedValueOnce(1).mockResolvedValueOnce(2);

    await service.updateDriverLocation('driver-fast', 10, 10);
    await service.updateDriverLocation('driver-fast', 10.1, 10.1);

    await expect(service.updateDriverLocation('driver-fast', 10.2, 10.2)).rejects.toThrow(
      /exceeded 2 updates/,
    );
    expect(metricsMock.incrementThrottled).toHaveBeenCalledWith('rest');
  });
});
