import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface Coordinate {
  lat: number;
  lng: number;
}

export interface RouteStep {
  distance: number;
  duration: number;
  geometry: string;
  name: string;
  maneuver: {
    type: string;
    modifier?: string;
    location: [number, number];
  };
}

export interface RouteLeg {
  distance: number;
  duration: number;
  steps: RouteStep[];
  summary: string;
}

export interface RouteResult {
  distance: number; // meters
  duration: number; // seconds
  geometry: string; // polyline encoded
  legs: RouteLeg[];
  source: 'osrm' | 'fallback';
}

interface OsrmRouteResponse {
  code: string;
  routes: Array<{
    distance: number;
    duration: number;
    geometry: string;
    legs: RouteLeg[];
  }>;
}

@Injectable()
export class OsrmService {
  private readonly logger = new Logger(OsrmService.name);
  private readonly osrmUrl: string;
  private readonly timeoutMs: number;

  constructor(private readonly configService: ConfigService) {
    this.osrmUrl = this.configService.get<string>('OSRM_API_URL') || 'http://localhost:5000';
    this.timeoutMs = Number(this.configService.get('OSRM_TIMEOUT_MS') || 5000);
    this.logger.log(`OSRM Service initialized with URL: ${this.osrmUrl}`);
  }

  /**
   * Calculates a route between two points using OSRM.
   * Falls back to straight-line distance if OSRM is unavailable.
   */
  async getRoute(origin: Coordinate, destination: Coordinate): Promise<RouteResult> {
    try {
      const result = await this.queryOsrm(origin, destination);
      return result;
    } catch (error) {
      this.logger.warn(`OSRM routing failed, using fallback: ${error}`);
      return this.calculateFallbackRoute(origin, destination);
    }
  }

  /**
   * Calculates a route with multiple waypoints.
   */
  async getRouteWithWaypoints(coordinates: Coordinate[]): Promise<RouteResult> {
    if (coordinates.length < 2) {
      throw new Error('At least 2 coordinates required for routing');
    }

    try {
      const coordString = coordinates.map((c) => `${c.lng},${c.lat}`).join(';');

      const url = `${this.osrmUrl}/route/v1/driving/${coordString}?overview=full&steps=true&geometries=polyline`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`OSRM error: ${response.status}`);
      }

      const data: OsrmRouteResponse = await response.json();

      if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
        throw new Error(`OSRM returned no routes: ${data.code}`);
      }

      const route = data.routes[0];
      return {
        distance: route.distance,
        duration: route.duration,
        geometry: route.geometry,
        legs: route.legs,
        source: 'osrm',
      };
    } catch (error) {
      this.logger.warn(`OSRM multi-waypoint routing failed: ${error}`);
      // Fallback: calculate straight-line for first/last point
      return this.calculateFallbackRoute(coordinates[0], coordinates[coordinates.length - 1]);
    }
  }

  /**
   * Gets the estimated time of arrival (ETA) between two points.
   */
  async getEta(origin: Coordinate, destination: Coordinate): Promise<number> {
    const route = await this.getRoute(origin, destination);
    return route.duration; // seconds
  }

  /**
   * Gets the distance between two points.
   */
  async getDistance(origin: Coordinate, destination: Coordinate): Promise<number> {
    const route = await this.getRoute(origin, destination);
    return route.distance; // meters
  }

  /**
   * Queries OSRM for a route between two points.
   */
  private async queryOsrm(origin: Coordinate, destination: Coordinate): Promise<RouteResult> {
    const url = `${this.osrmUrl}/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&steps=true&geometries=polyline`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`OSRM HTTP error: ${response.status}`);
      }

      const data: OsrmRouteResponse = await response.json();

      if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
        throw new Error(`OSRM no route found: ${data.code}`);
      }

      const route = data.routes[0];
      this.logger.debug(`Route: ${route.distance}m, ${route.duration}s`);

      return {
        distance: route.distance,
        duration: route.duration,
        geometry: route.geometry,
        legs: route.legs,
        source: 'osrm',
      };
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Calculates a fallback route using Haversine formula.
   * Used when OSRM is unavailable.
   */
  private calculateFallbackRoute(origin: Coordinate, destination: Coordinate): RouteResult {
    const distance = this.haversineDistance(origin, destination);
    // Assume average speed of 30 km/h in urban areas
    const duration = (distance / 30000) * 3600; // seconds

    this.logger.log(`Fallback route: ${distance.toFixed(0)}m, ${duration.toFixed(0)}s`);

    return {
      distance,
      duration,
      geometry: '', // No polyline available in fallback
      legs: [],
      source: 'fallback',
    };
  }

  /**
   * Calculates distance between two coordinates using Haversine formula.
   * @returns Distance in meters
   */
  private haversineDistance(coord1: Coordinate, coord2: Coordinate): number {
    const R = 6371000; // Earth's radius in meters
    const toRad = (deg: number) => (deg * Math.PI) / 180;

    const dLat = toRad(coord2.lat - coord1.lat);
    const dLng = toRad(coord2.lng - coord1.lng);
    const lat1 = toRad(coord1.lat);
    const lat2 = toRad(coord2.lat);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }
}
