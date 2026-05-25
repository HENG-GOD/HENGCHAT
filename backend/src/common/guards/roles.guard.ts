import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { Role, ROLE_HIERARCHY } from '../constants/roles.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (!required?.length) return true;

    const { user } = ctx.switchToHttp().getRequest();
    if (!user?.role) throw new ForbiddenException();
    const userRank = ROLE_HIERARCHY[user.role as Role] ?? 0;
    const minRank = Math.min(...required.map((r) => ROLE_HIERARCHY[r]));
    if (userRank < minRank) throw new ForbiddenException('Insufficient role');
    return true;
  }
}
