import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (isPublic) return true;

    const req = ctx.switchToHttp().getRequest();
    const auth = req.headers['authorization'] as string | undefined;
    if (!auth?.startsWith('Bearer ')) throw new UnauthorizedException('Missing token');
    const token = auth.slice(7);
    try {
      const payload = await this.jwt.verifyAsync(token, {
        secret: this.config.get<string>('jwt.secret'),
      });
      req.user = {
        id: payload.sub,
        workspaceId: payload.workspaceId,
        role: payload.role,
        email: payload.email,
        name: payload.name,
      };
      return true;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
