import { Controller, Get, Post, Delete, Body, Param } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { CustomThrottlerGuard } from './throttler.guard';

/**
 * Throttler Controller
 *
 * Admin endpoints for managing rate limiting.
 */
@Controller('admin/throttler')
@SkipThrottle() // Admin endpoints bypass rate limiting
export class ThrottlerController {
  constructor(private readonly throttlerGuard: CustomThrottlerGuard) {}

  /**
   * Get rate limiting metrics.
   */
  @Get('metrics')
  getMetrics() {
    return this.throttlerGuard.getMetrics();
  }

  /**
   * Add IP to allowlist.
   */
  @Post('allowlist')
  addToAllowlist(@Body() body: { ip: string }) {
    this.throttlerGuard.addToAllowlist(body.ip);
    return { success: true, message: `IP ${body.ip} added to allowlist` };
  }

  /**
   * Add IP to denylist.
   */
  @Post('denylist')
  addToDenylist(@Body() body: { ip: string }) {
    this.throttlerGuard.addToDenylist(body.ip);
    return { success: true, message: `IP ${body.ip} added to denylist` };
  }

  /**
   * Remove IP from denylist.
   */
  @Delete('denylist/:ip')
  removeFromDenylist(@Param('ip') ip: string) {
    this.throttlerGuard.removeFromDenylist(ip);
    return { success: true, message: `IP ${ip} removed from denylist` };
  }

  /**
   * Get rate limits info.
   */
  @Get('limits')
  getLimits() {
    return {
      tiers: [
        { name: 'short', limit: 10, window: '1 second' },
        { name: 'medium', limit: 100, window: '1 minute' },
        { name: 'long', limit: 1000, window: '1 hour' },
      ],
      documentation: 'https://docs.puente.com/rate-limits',
    };
  }
}
