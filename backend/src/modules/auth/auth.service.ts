import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async validate(email: string, password: string) {
    const agent = await this.prisma.agent.findUnique({ where: { email } });
    if (!agent) throw new UnauthorizedException('Invalid credentials');
    const ok = await argon2.verify(agent.passwordHash, password);
    if (!ok) throw new UnauthorizedException('Invalid credentials');
    return agent;
  }

  async login(email: string, password: string) {
    const agent = await this.validate(email, password);

    const payload = {
      sub: agent.id,
      workspaceId: agent.workspaceId,
      role: agent.role,
      email: agent.email,
      name: agent.name,
    };

    const accessToken = await this.jwt.signAsync(payload, {
      secret: this.config.get<string>('jwt.secret'),
      expiresIn: this.config.get<string>('jwt.expiresIn'),
    });
    const refreshToken = await this.jwt.signAsync(
      { sub: agent.id },
      {
        secret: this.config.get<string>('jwt.refreshSecret'),
        expiresIn: this.config.get<string>('jwt.refreshExpiresIn'),
      },
    );

    await this.prisma.agent.update({
      where: { id: agent.id },
      data: { lastSeenAt: new Date() },
    });

    return {
      accessToken,
      refreshToken,
      agent: {
        id: agent.id,
        workspaceId: agent.workspaceId,
        name: agent.name,
        email: agent.email,
        role: agent.role,
      },
    };
  }

  async me(agentId: string) {
    const agent = await this.prisma.agent.findUnique({
      where: { id: agentId },
      select: {
        id: true,
        workspaceId: true,
        name: true,
        email: true,
        role: true,
        isOnline: true,
        lastSeenAt: true,
      },
    });
    if (!agent) throw new UnauthorizedException();
    return agent;
  }

  async logout(agentId: string) {
    await this.prisma.agent.update({
      where: { id: agentId },
      data: { isOnline: false, lastSeenAt: new Date() },
    });
    return { ok: true };
  }
}
