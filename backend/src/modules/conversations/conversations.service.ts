import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { RT_EVENTS } from '../../common/constants/events';
import { Role } from '../../common/constants/roles.enum';
import { decodeCursor, encodeCursor } from '../../common/utils/pagination.util';

interface ListFilters {
  channelId?: string;
  assignedAgentId?: string;
  status?: 'open' | 'pending' | 'closed';
  unreadOnly?: boolean;
  keyword?: string;
  tagId?: string;
  cursor?: string;
  limit?: number;
}

@Injectable()
export class ConversationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeGateway,
  ) {}

  async list(workspaceId: string, filters: ListFilters, viewer: { id: string; role: Role }) {
    const limit = Math.min(filters.limit ?? 30, 100);
    const where: Prisma.ConversationWhereInput = { workspaceId };
    if (filters.channelId) where.lineChannelId = filters.channelId;
    if (filters.status) where.status = filters.status;
    if (filters.assignedAgentId) where.assignedAgentId = filters.assignedAgentId;
    if (filters.unreadOnly) where.unreadCount = { gt: 0 };
    if (filters.tagId) where.tags = { some: { tagId: filters.tagId } };
    if (filters.keyword) {
      where.OR = [
        { contact: { displayName: { contains: filters.keyword, mode: 'insensitive' } } },
        { messages: { some: { textContent: { contains: filters.keyword, mode: 'insensitive' } } } },
      ];
    }
    // Agents see only assigned or unassigned-open
    if (viewer.role === Role.Agent) {
      where.OR = [
        { assignedAgentId: viewer.id },
        { assignedAgentId: null, status: 'open' },
      ];
    }

    const cursor = decodeCursor(filters.cursor);
    const items = await this.prisma.conversation.findMany({
      where,
      take: limit + 1,
      orderBy: [{ lastMessageAt: 'desc' }, { id: 'desc' }],
      ...(cursor
        ? {
            cursor: { id: cursor.id },
            skip: 1,
          }
        : {}),
      include: {
        contact: { select: { id: true, displayName: true, pictureUrl: true, lineUserId: true } },
        lineChannel: { select: { id: true, name: true } },
        assignedAgent: { select: { id: true, name: true } },
        tags: { include: { tag: true } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { id: true, textContent: true, messageType: true, direction: true, createdAt: true },
        },
      },
    });

    let nextCursor: string | null = null;
    if (items.length > limit) {
      const next = items.pop()!;
      nextCursor = encodeCursor({ id: next.id, createdAt: next.lastMessageAt ?? next.createdAt });
    }
    return { items, nextCursor };
  }

  async get(workspaceId: string, id: string, viewer: { id: string; role: Role }) {
    const conv = await this.prisma.conversation.findFirst({
      where: { id, workspaceId },
      include: {
        contact: true,
        lineChannel: { select: { id: true, name: true, channelId: true } },
        assignedAgent: { select: { id: true, name: true, email: true } },
        tags: { include: { tag: true } },
      },
    });
    if (!conv) throw new NotFoundException();
    if (
      viewer.role === Role.Agent &&
      conv.assignedAgentId &&
      conv.assignedAgentId !== viewer.id
    ) {
      throw new ForbiddenException('Conversation not assigned to you');
    }
    return conv;
  }

  async assign(workspaceId: string, id: string, agentId: string | null) {
    await this.ensure(workspaceId, id);
    const conv = await this.prisma.conversation.update({
      where: { id },
      data: { assignedAgentId: agentId },
    });
    this.realtime.emitWorkspace(workspaceId, RT_EVENTS.ConversationAssigned, {
      id,
      assignedAgentId: agentId,
    });
    return conv;
  }

  async setStatus(workspaceId: string, id: string, status: 'open' | 'pending' | 'closed') {
    await this.ensure(workspaceId, id);
    const conv = await this.prisma.conversation.update({
      where: { id },
      data: { status: status as any },
    });
    this.realtime.emitWorkspace(workspaceId, RT_EVENTS.ConversationUpdated, { id, status });
    if (status === 'closed') {
      this.realtime.emitWorkspace(workspaceId, RT_EVENTS.ConversationClosed, { id });
    }
    return conv;
  }

  async markRead(workspaceId: string, id: string) {
    await this.ensure(workspaceId, id);
    return this.prisma.conversation.update({
      where: { id },
      data: { unreadCount: 0 },
    });
  }

  async addTag(workspaceId: string, id: string, tagId: string) {
    await this.ensure(workspaceId, id);
    await this.prisma.conversationTag.upsert({
      where: { conversationId_tagId: { conversationId: id, tagId } },
      create: { conversationId: id, tagId },
      update: {},
    });
    return this.get(workspaceId, id, { id: '', role: Role.Owner });
  }

  async removeTag(workspaceId: string, id: string, tagId: string) {
    await this.ensure(workspaceId, id);
    await this.prisma.conversationTag.deleteMany({
      where: { conversationId: id, tagId },
    });
    return this.get(workspaceId, id, { id: '', role: Role.Owner });
  }

  private async ensure(workspaceId: string, id: string) {
    const c = await this.prisma.conversation.findFirst({ where: { id, workspaceId } });
    if (!c) throw new NotFoundException();
    return c;
  }
}
