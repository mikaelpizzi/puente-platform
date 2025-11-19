import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private configService: ConfigService) {}

  /**
   * Middleware to validate JWT access tokens.
   * Extracts the token from the Authorization header, verifies it, and attaches the decoded user to the request.
   *
   * @param req - The incoming request object.
   * @param res - The response object.
   * @param next - The next middleware function.
   * @throws UnauthorizedException - If the Authorization header is missing, invalid, or the token is invalid.
   */
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
