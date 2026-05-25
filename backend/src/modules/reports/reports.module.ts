import { Controller, Get, Injectable, Module, UseGuards } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/constants/roles.enum';
import { RolesGuard } from '../../common/guards/roles.guard';

@Injectable()
class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async summary(workspaceId: string) {
    const [openConversations, closedConversations, unreadConversations, inboundMessages, outboundMessages, onlineAgents] =
      await Promise.all([
        this.prisma.conversation.count({ where: { workspaceId, status: 'open' } }),
        this.prisma.conversation.count({ where: { workspaceId, status: 'closed' } }),
        this.prisma.conversation.count({ where: { workspaceId, unreadCount: { gt: 0 } } }),
        this.prisma.message.count({ where: { workspaceId, direction: 'inbound' } }),
        this.prisma.message.count({ where: { workspaceId, direction: 'outbound' } }),
        this.prisma.agent.count({ where: { workspaceId, isOnline: true } }),
      ]);
    return {
      openConversations,
      closedConversations,
      unreadConversations,
      inboundMessages,
      outboundMessages,
      onlineAgents,
    };
  }

  async perAgent(workspaceId: string) {
    const rows = await this.prisma.message.groupBy({
      by: ['senderId'],
      where: { workspaceId, direction: 'outbound', senderType: 'agent' },
      _count: { _all: true },
    });
    const agents = await this.prisma.agent.findMany({
      where: { workspaceId, id: { in: rows.map((r) => r.senderId).filter(Boolean) as string[] } },
      select: { id: true, name: true, email: true },
    });
    const map = Object.fromEntries(agents.map((a) => [a.id, a]));
    return rows.map((r) => ({
      agent: r.senderId ? map[r.senderId] : null,
      outboundCount: r._count._all,
    }));
  }

  async perChannel(workspaceId: string) {
    const rows = await this.prisma.conversation.groupBy({
      by: ['lineChannelId', 'status'],
      where: { workspaceId },
      _count: { _all: true },
    });
    const channels = await this.prisma.lineChannel.findMany({
      where: { workspaceId },
      select: { id: true, name: true },
    });
    const chMap = Object.fromEntries(channels.map((c) => [c.id, c.name]));
    return rows.map((r) => ({
      channelId: r.lineChannelId,
      channelName: chMap[r.lineChannelId] ?? r.lineChannelId,
      status: r.status,
      count: r._count._all,
    }));
  }
}

@UseGuards(RolesGuard)
@Controller('reports')
class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Roles(Role.Supervisor)
  @Get('summary')
  summary(@CurrentUser() u: AuthUser) {
    return this.reports.summary(u.workspaceId);
  }

  @Roles(Role.Supervisor)
  @Get('agents')
  agents(@CurrentUser() u: AuthUser) {
    return this.reports.perAgent(u.workspaceId);
  }

  @Roles(Role.Supervisor)
  @Get('channels')
  channels(@CurrentUser() u: AuthUser) {
    return this.reports.perChannel(u.workspaceId);
  }
}

@Module({ providers: [ReportsService], controllers: [ReportsController] })
export class ReportsModule {}
