import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerException } from '@nestjs/throttler';

/**
 * Custom Throttler Guard
 *
 * Extends default throttler with:
 * - Allowlist (bypass rate limiting)
 * - Denylist (always block)
 * - Metrics tracking
 */
@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  // IPs that bypass rate limiting (e.g., internal services, monitors)
  private readonly allowlist: Set<string> = new Set([
    '127.0.0.1',
    '::1',
    // Add internal service IPs here
  ]);

  // IPs that are always blocked
  private readonly denylist: Set<string> = new Set([
    // Add known malicious IPs here
  ]);

  // Metrics
  private metrics = {
    totalRequests: 0,
    blockedRequests: 0,
    deniedRequests: 0,
    bypassedRequests: 0,
  };

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const ip = this.getClientIp(request);

    this.metrics.totalRequests++;

    // Check denylist first
    if (this.denylist.has(ip)) {
      this.metrics.deniedRequests++;
      throw new ThrottlerException('Access denied');
    }

    // Check allowlist (bypass throttling)
    if (this.allowlist.has(ip)) {
      this.metrics.bypassedRequests++;
      return true;
    }

    // Apply standard rate limiting
    try {
      return await super.canActivate(context);
    } catch (error) {
      if (error instanceof ThrottlerException) {
        this.metrics.blockedRequests++;
      }
      throw error;
    }
  }

  /**
   * Get client IP from request.
   */
  private getClientIp(request: any): string {
    return (
      request.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      request.headers['x-real-ip'] ||
      request.ip ||
      request.connection?.remoteAddress ||
      ''
    );
  }

  /**
   * Override to use custom key (IP-based).
   */
  protected async getTracker(request: Record<string, any>): Promise<string> {
    return this.getClientIp(request);
  }

  /**
   * Get rate limiting metrics.
   */
  getMetrics() {
    return { ...this.metrics };
  }

  /**
   * Add IP to allowlist.
   */
  addToAllowlist(ip: string) {
    this.allowlist.add(ip);
  }

  /**
   * Add IP to denylist.
   */
  addToDenylist(ip: string) {
    this.denylist.add(ip);
  }

  /**
   * Remove IP from denylist.
   */
  removeFromDenylist(ip: string) {
    this.denylist.delete(ip);
  }
}
