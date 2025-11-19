import { Test, TestingModule } from '@nestjs/testing';
import { LogisticsService } from './logistics.service';
import Redis from 'ioredis';

const mockRedis = {
  geoadd: vi.fn(),
  georadius: vi.fn(),
  publish: vi.fn(),
};

describe('LogisticsService', () => {
  let service: LogisticsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LogisticsService,
        {
          provide: 'REDIS_CLIENT',
          useValue: mockRedis,
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
    expect(mockRedis.publish).toHaveBeenCalledWith(
      'driver.location.updated',
      JSON.stringify({ driverId, lat, lng }),
    );
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
});
