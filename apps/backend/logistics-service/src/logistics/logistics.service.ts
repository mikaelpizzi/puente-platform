import { Injectable, Inject, Logger } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class LogisticsService {
  private readonly logger = new Logger(LogisticsService.name);
  private readonly GEO_KEY = 'drivers:locations';

  constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) {}

  async updateDriverLocation(driverId: string, lat: number, lng: number): Promise<void> {
    // GEOADD key longitude latitude member
    await this.redis.geoadd(this.GEO_KEY, lng, lat, driverId);
    this.logger.debug(`Updated location for driver ${driverId}: [${lat}, ${lng}]`);

    // Publish event for real-time tracking
    await this.publishEvent('driver.location.updated', { driverId, lat, lng });
  }

  async getNearbyDrivers(lat: number, lng: number, radiusKm: number): Promise<any[]> {
    // GEORADIUS key longitude latitude radius m|km|ft|mi WITHDIST WITHCOORD
    // Note: ioredis returns raw array responses for some commands, but georadius is standard.
    // Using geosearch (newer Redis versions) or georadius.

    const drivers = await this.redis.georadius(
      this.GEO_KEY,
      lng,
      lat,
      radiusKm,
      'km',
      'WITHDIST',
      'WITHCOORD',
    );

    // Format response
    return (drivers as any[]).map((d) => ({
      driverId: d[0],
      distance: d[1], // km
      coordinates: {
        lng: d[2][0],
        lat: d[2][1],
      },
    }));
  }

  async publishEvent(channel: string, payload: any): Promise<number> {
    const message = JSON.stringify(payload);
    return this.redis.publish(channel, message);
  }
}
