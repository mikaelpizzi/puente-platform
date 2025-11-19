import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Observable } from 'rxjs';

@Injectable()
export class ServiceAuthGuard implements CanActivate {
  private readonly logger = new Logger(ServiceAuthGuard.name);

  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const secretHeader = request.headers['x-gateway-secret'];
    const expectedSecret = this.configService.get<string>('GATEWAY_SHARED_SECRET');

    if (!expectedSecret) {
      this.logger.error('GATEWAY_SHARED_SECRET is not configured in the environment variables.');
      return false; // Fail safe: if no secret is configured, deny everything.
    }

    if (secretHeader !== expectedSecret) {
      this.logger.warn(
        `Unauthorized access attempt from ${request.ip}. Missing or invalid secret header.`,
      );
      throw new UnauthorizedException('Service-to-Service authentication failed');
    }

    return true;
  }
}
