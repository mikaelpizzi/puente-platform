import { BadRequestException, Injectable, NestMiddleware } from '@nestjs/common';

@Injectable()
export class SanityCheckMiddleware implements NestMiddleware {
  use(req: any, res: any, next: () => void) {
    const method = req.method?.toUpperCase();
    const body = req.body;

    if ((method === 'GET' || method === 'DELETE') && body && Object.keys(body).length > 0) {
      throw new BadRequestException('Body is not allowed for GET/DELETE requests');
    }

    next();
  }
}
