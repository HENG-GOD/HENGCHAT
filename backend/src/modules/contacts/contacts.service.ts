import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ContactsService {
  constructor(private readonly prisma: PrismaService) {}

  list(workspaceId: string, q: { channelId?: string; keyword?: string }) {
    return this.prisma.contact.findMany({
      where: {
        workspaceId,
        ...(q.channelId ? { lineChannelId: q.channelId } : {}),
        ...(q.keyword
          ? { displayName: { contains: q.keyword, mode: 'insensitive' as const } }
          : {}),
      },
      orderBy: { lastMessageAt: 'desc' },
      take: 100,
    });
  }

  async get(workspaceId: string, id: string) {
    const c = await this.prisma.contact.findFirst({ where: { id, workspaceId } });
    if (!c) throw new NotFoundException();
    return c;
  }

  async update(workspaceId: string, id: string, data: { displayName?: string; status?: 'active' | 'blocked' }) {
    await this.get(workspaceId, id);
    return this.prisma.contact.update({
      where: { id },
      data: { displayName: data.displayName, status: data.status as any },
    });
  }
}
