import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid Authorization header');
    }

    const token = authHeader.split(' ')[1];
    const secret = this.configService.get<string>('AUTH_JWT_ACCESS_SECRET');

    if (!secret) {
      // Fail fast with a clear error so the runtime/config is fixed instead of a cryptic TS/runtime error
      throw new Error('Missing AUTH_JWT_ACCESS_SECRET configuration for JWT verification');
    }

    try {
      const decoded = jwt.verify(token, secret as jwt.Secret);
      request.user = decoded;
      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
