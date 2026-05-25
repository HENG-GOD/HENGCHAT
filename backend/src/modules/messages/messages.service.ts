import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { QUEUE_NAMES, RT_EVENTS } from '../../common/constants/events';
import { SendMessageDto } from './dto/message.dto';
import { decodeCursor, encodeCursor } from '../../common/utils/pagination.util';

@Injectable()
export class MessagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly realtime: RealtimeGateway,
    @InjectQueue(QUEUE_NAMES.OutboundMessages) private readonly outboundQueue: Queue,
  ) {}

  async list(workspaceId: string, conversationId: string, cursorStr?: string, limit = 50) {
    const conv = await this.prisma.conversation.findFirst({
      where: { id: conversationId, workspaceId },
      select: { id: true },
    });
    if (!conv) throw new NotFoundException();

    const cursor = decodeCursor(cursorStr);
    const take = Math.min(limit, 100);
    const items = await this.prisma.message.findMany({
      where: { conversationId, workspaceId },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: take + 1,
      ...(cursor ? { cursor: { id: cursor.id }, skip: 1 } : {}),
      include: { attachments: true },
    });

    let nextCursor: string | null = null;
    if (items.length > take) {
      const next = items.pop()!;
      nextCursor = encodeCursor({ id: next.id, createdAt: next.createdAt });
    }
    return { items: items.reverse(), nextCursor };
  }

  async send(workspaceId: string, agentId: string, dto: SendMessageDto) {
    const conv = await this.prisma.conversation.findFirst({
      where: { id: dto.conversationId, workspaceId },
      include: { contact: true },
    });
    if (!conv) throw new NotFoundException('Conversation not found');
    if (conv.status === 'closed') {
      throw new BadRequestException('Conversation is closed');
    }

    if (dto.messageType === 'text' && !dto.text?.trim()) {
      throw new BadRequestException('text is required');
    }
    if (dto.messageType === 'image' && !dto.attachmentId) {
      throw new BadRequestException('attachmentId is required for image');
    }

    const msg = await this.prisma.message.create({
      data: {
        workspaceId,
        lineChannelId: conv.lineChannelId,
        conversationId: conv.id,
        contactId: conv.contactId,
        senderType: 'agent',
        senderId: agentId,
        direction: 'outbound',
        messageType: dto.messageType as any,
        textContent: dto.text ?? null,
        sendStatus: 'pending',
      },
    });

    if (dto.messageType === 'image' && dto.attachmentId) {
      // Re-link uploaded attachment to this message
      await this.prisma.messageAttachment.update({
        where: { id: dto.attachmentId },
        data: { messageId: msg.id },
      });
    }

    await this.prisma.conversation.update({
      where: { id: conv.id },
      data: { lastMessageAt: new Date() },
    });

    this.realtime.emitConversation(conv.id, RT_EVENTS.MessageNew, await this.withAttachments(msg.id));

    await this.outboundQueue.add('send', { messageId: msg.id }, { jobId: msg.id });
    return this.withAttachments(msg.id);
  }

  private withAttachments(id: string) {
    return this.prisma.message.findUnique({ where: { id }, include: { attachments: true } });
  }

  /**
   * Upload an attachment file that an agent will then attach to a message.
   * Returns the attachment metadata; the actual message create call references attachmentId.
   */
  async upload(workspaceId: string, file: { buffer: Buffer; mimeType?: string; originalname?: string }) {
    const upload = await this.storage.uploadBuffer(`agent-uploads/${workspaceId}`, file.buffer, {
      mimeType: file.mimeType,
      fileName: file.originalname,
    });
    return this.prisma.messageAttachment.create({
      data: {
        // messageId is intentionally a placeholder until linked on send
        messageId: '00000000-0000-0000-0000-000000000000',
        fileName: file.originalname,
        fileType: (file.mimeType ?? 'file').split('/')[0] || 'file',
        mimeType: file.mimeType,
        fileUrl: upload.url,
        fileSize: upload.size,
      },
    });
  }
}
