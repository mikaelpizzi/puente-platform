import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { Role } from '../enums/role.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    // API Gateway injects X-User-Role header
    const userRole = request.headers['x-user-role'];

    if (!userRole) {
      // If no role header is present, but roles are required, deny access.
      // This assumes that the Gateway ALWAYS sends the header for authenticated users.
      // If the endpoint allows public access, requiredRoles should probably not be set,
      // or we need a Public decorator.
      // For now, if roles are required, we expect the header.
      throw new ForbiddenException('Access Denied: No role provided');
    }

    return requiredRoles.some((role) => role === userRole);
  }
}
