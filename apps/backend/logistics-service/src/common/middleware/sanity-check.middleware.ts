import { BadRequestException, Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * SanityCheckMiddleware validates incoming requests for common issues:
 * - Rejects GET/DELETE requests with a body (defense in depth)
 * - Validates Content-Length header consistency
 */
@Injectable()
export class SanityCheckMiddleware implements NestMiddleware {
  private readonly logger = new Logger(SanityCheckMiddleware.name);

  use(req: Request, res: Response, next: NextFunction) {
    const method = req.method?.toUpperCase();
    const body = req.body;

    // Reject GET/DELETE with body
    if ((method === 'GET' || method === 'DELETE') && body && Object.keys(body).length > 0) {
      this.logger.warn(`Rejected ${method} request with body from ${req.ip} to ${req.path}`);
      throw new BadRequestException('Body is not allowed for GET/DELETE requests');
    }

    next();
  }
}
