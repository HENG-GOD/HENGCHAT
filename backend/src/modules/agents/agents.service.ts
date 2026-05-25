import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAgentDto, UpdateAgentDto } from './dto/create-agent.dto';
import { Role } from '../../common/constants/roles.enum';

@Injectable()
export class AgentsService {
  constructor(private readonly prisma: PrismaService) {}

  list(workspaceId: string) {
    return this.prisma.agent.findMany({
      where: { workspaceId },
      select: {
        id: true, name: true, email: true, role: true,
        isOnline: true, lastSeenAt: true, createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async get(workspaceId: string, id: string) {
    const a = await this.prisma.agent.findFirst({
      where: { id, workspaceId },
      select: {
        id: true, name: true, email: true, role: true,
        isOnline: true, lastSeenAt: true, createdAt: true,
      },
    });
    if (!a) throw new NotFoundException('Agent not found');
    return a;
  }

  async create(workspaceId: string, dto: CreateAgentDto) {
    const passwordHash = await argon2.hash(dto.password);
    return this.prisma.agent.create({
      data: {
        workspaceId,
        name: dto.name,
        email: dto.email,
        passwordHash,
        role: (dto.role ?? Role.Agent) as any,
      },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });
  }

  async update(workspaceId: string, id: string, dto: UpdateAgentDto, actorRole: Role) {
    const target = await this.prisma.agent.findFirst({ where: { id, workspaceId } });
    if (!target) throw new NotFoundException();
    if (target.role === Role.Owner && actorRole !== Role.Owner) {
      throw new ForbiddenException('Cannot modify owner');
    }
    const data: any = {};
    if (dto.name) data.name = dto.name;
    if (dto.role) data.role = dto.role;
    if (dto.password) data.passwordHash = await argon2.hash(dto.password);
    return this.prisma.agent.update({
      where: { id },
      data,
      select: { id: true, name: true, email: true, role: true },
    });
  }

  setOnline(id: string, isOnline: boolean) {
    return this.prisma.agent.update({
      where: { id },
      data: { isOnline, lastSeenAt: new Date() },
    });
  }
}
