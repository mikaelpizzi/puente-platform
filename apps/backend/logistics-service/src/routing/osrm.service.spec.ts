import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { OsrmService, Coordinate, RouteResult } from './osrm.service';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('OsrmService', () => {
  let service: OsrmService;
  let configService: ConfigService;

  const mockRoute = {
    code: 'Ok',
    routes: [
      {
        distance: 12500, // 12.5 km
        duration: 1500, // 25 minutes
        geometry: 'encoded_polyline_string',
        legs: [
          {
            distance: 12500,
            duration: 1500,
            steps: [],
            summary: 'Main St, 2nd Ave',
          },
        ],
      },
    ],
  };

  beforeEach(async () => {
    mockFetch.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OsrmService,
        {
          provide: ConfigService,
          useValue: {
            get: vi.fn((key: string) => {
              if (key === 'OSRM_API_URL') return 'http://localhost:5000';
              if (key === 'OSRM_TIMEOUT_MS') return '5000';
              return undefined;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<OsrmService>(OsrmService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getRoute', () => {
    const origin: Coordinate = { lat: 10.4806, lng: -66.9036 }; // Caracas
    const destination: Coordinate = { lat: 10.6427, lng: -71.6119 }; // Maracaibo

    it('should return route from OSRM', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockRoute),
      });

      const result = await service.getRoute(origin, destination);

      expect(result.distance).toBe(12500);
      expect(result.duration).toBe(1500);
      expect(result.source).toBe('osrm');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('http://localhost:5000/route/v1/driving/'),
        expect.any(Object),
      );
    });

    it('should fallback to Haversine when OSRM fails', async () => {
      mockFetch.mockRejectedValue(new Error('OSRM unavailable'));

      const result = await service.getRoute(origin, destination);

      expect(result.source).toBe('fallback');
      expect(result.distance).toBeGreaterThan(0);
      expect(result.duration).toBeGreaterThan(0);
    });

    it('should fallback when OSRM returns no routes', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ code: 'NoRoute', routes: [] }),
      });

      const result = await service.getRoute(origin, destination);

      expect(result.source).toBe('fallback');
    });
  });

  describe('getEta', () => {
    it('should return duration in seconds', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockRoute),
      });

      const origin: Coordinate = { lat: 10.4806, lng: -66.9036 };
      const destination: Coordinate = { lat: 10.6427, lng: -71.6119 };

      const eta = await service.getEta(origin, destination);

      expect(eta).toBe(1500);
    });
  });

  describe('getDistance', () => {
    it('should return distance in meters', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockRoute),
      });

      const origin: Coordinate = { lat: 10.4806, lng: -66.9036 };
      const destination: Coordinate = { lat: 10.6427, lng: -71.6119 };

      const distance = await service.getDistance(origin, destination);

      expect(distance).toBe(12500);
    });
  });

  describe('getRouteWithWaypoints', () => {
    it('should calculate route with multiple waypoints', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockRoute),
      });

      const waypoints: Coordinate[] = [
        { lat: 10.4806, lng: -66.9036 },
        { lat: 10.5, lng: -67.0 },
        { lat: 10.6427, lng: -71.6119 },
      ];

      const result = await service.getRouteWithWaypoints(waypoints);

      expect(result.source).toBe('osrm');
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining(';'), expect.any(Object));
    });

    it('should throw error with less than 2 coordinates', async () => {
      await expect(service.getRouteWithWaypoints([{ lat: 10, lng: -66 }])).rejects.toThrow(
        'At least 2 coordinates required',
      );
    });
  });
});
