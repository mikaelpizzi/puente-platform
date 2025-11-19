import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private configService: ConfigService) {}

  use(req: any, res: any, next: () => void) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid Authorization header');
    }

    const token = authHeader.split(' ')[1];
    const secret = this.configService.get<string>('AUTH_JWT_ACCESS_SECRET');

    try {
      const decoded = jwt.verify(token, secret!);
      req.user = decoded;
      next();
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
