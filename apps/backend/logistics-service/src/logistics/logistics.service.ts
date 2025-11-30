import { Injectable, Inject, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { performance } from 'node:perf_hooks';
import Redis from 'ioredis';
import { MetricsService, TelemetryIngestSource } from '../metrics/metrics.service';

@Injectable()
export class LogisticsService {
  private readonly logger = new Logger(LogisticsService.name);
  private readonly GEO_KEY = 'drivers:locations';
  private readonly HISTORY_KEY_PREFIX = 'drivers:history';
  private readonly THROTTLE_KEY_PREFIX = 'drivers:telemetry';
  private readonly historySize: number;
  private readonly historyTtlSeconds: number;
  private readonly throttleWindowMs: number;
  private readonly throttleMaxEvents: number;

  constructor(
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
    private readonly configService: ConfigService,
    private readonly metricsService: MetricsService,
  ) {
    this.historySize = Math.max(1, Number(this.configService.get('LOGISTICS_HISTORY_SIZE') ?? 20));
    this.historyTtlSeconds = Math.max(
      60,
      Number(this.configService.get('LOGISTICS_HISTORY_TTL_SECONDS') ?? 60 * 60),
    );
    this.throttleWindowMs = Math.max(
      500,
      Number(this.configService.get('LOGISTICS_THROTTLE_WINDOW_MS') ?? 3000),
    );
    this.throttleMaxEvents = Math.max(
      1,
      Number(this.configService.get('LOGISTICS_THROTTLE_MAX_EVENTS') ?? 5),
    );
  }

  async updateDriverLocation(
    driverId: string,
    lat: number,
    lng: number,
    source: TelemetryIngestSource = 'rest',
  ): Promise<void> {
    const start = performance.now();

    await this.enforceThrottle(driverId, source);

    await this.redis.geoadd(this.GEO_KEY, lng, lat, driverId);
    await this.persistLocationHistory(driverId, lat, lng);
    this.logger.debug(`Updated location for driver ${driverId}: [${lat}, ${lng}]`);

    await this.publishEvent('driver.location.updated', { driverId, lat, lng });

    this.metricsService.observeIngest(source, performance.now() - start);
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

  private getHistoryKey(driverId: string): string {
    return `${this.HISTORY_KEY_PREFIX}:${driverId}`;
  }

  private getThrottleKey(driverId: string): string {
    return `${this.THROTTLE_KEY_PREFIX}:${driverId}`;
  }

  private async persistLocationHistory(driverId: string, lat: number, lng: number): Promise<void> {
    const key = this.getHistoryKey(driverId);
    const entry = JSON.stringify({ lat, lng, capturedAt: new Date().toISOString() });
    await this.redis.lpush(key, entry);
    await this.redis.ltrim(key, 0, this.historySize - 1);
    await this.redis.expire(key, this.historyTtlSeconds);
  }

  private async enforceThrottle(driverId: string, source: TelemetryIngestSource): Promise<void> {
    const key = this.getThrottleKey(driverId);
    const now = Date.now();
    const windowStart = now - this.throttleWindowMs;

    await this.redis.zremrangebyscore(key, 0, windowStart);
    const eventCount = await this.redis.zcard(key);

    if (eventCount >= this.throttleMaxEvents) {
      this.metricsService.incrementThrottled(source);
      throw new HttpException(
        `Driver ${driverId} exceeded ${this.throttleMaxEvents} updates per ${this.throttleWindowMs}ms window`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    await this.redis.zadd(key, now, `${now}`);
    await this.redis.pexpire(key, this.throttleWindowMs);
  }
}
