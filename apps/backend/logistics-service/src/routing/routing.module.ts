import { Module, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { OsrmService, RouteResult, Coordinate } from './osrm.service';

/**
 * Mock OSRM Service for graceful degradation.
 * Used when OSRM routing service is not available (ENABLE_OSRM=false).
 */
class MockOsrmService {
  private readonly logger = new Logger('MockOsrmService');

  constructor(_configService: ConfigService) {
    this.logger.warn('🔇 MockOsrmService initialized - OSRM routing is disabled');
  }

  async getRoute(_origin: Coordinate, _destination: Coordinate): Promise<RouteResult> {
    return {
      distance: 0,
      duration: 0,
      geometry: '',
      legs: [],
      source: 'fallback',
    };
  }

  async getRouteWithWaypoints(_coordinates: Coordinate[]): Promise<RouteResult> {
    return {
      distance: 0,
      duration: 0,
      geometry: '',
      legs: [],
      source: 'fallback',
    };
  }

  async getEta(_origin: Coordinate, _destination: Coordinate): Promise<number> {
    return 0;
  }

  async getDistance(_origin: Coordinate, _destination: Coordinate): Promise<number> {
    return 0;
  }
}

// Determine which service to use based on environment variable
const osrmEnabled = process.env.ENABLE_OSRM !== 'false';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: OsrmService,
      useClass: osrmEnabled ? OsrmService : MockOsrmService,
    },
  ],
  exports: [OsrmService],
})
export class RoutingModule {}
