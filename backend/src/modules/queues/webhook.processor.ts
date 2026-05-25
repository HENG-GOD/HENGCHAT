import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { ChannelsService } from '../channels/channels.service';
import { LineService } from '../line/line.service';
import { StorageService } from '../storage/storage.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { QUEUE_NAMES, RT_EVENTS } from '../../common/constants/events';

interface WebhookJob {
  webhookEventId: string;
  lineChannelId: string;
}

@Processor(QUEUE_NAMES.WebhookEvents, { concurrency: 8 })
export class WebhookProcessor extends WorkerHost {
  private readonly logger = new Logger(WebhookProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly channels: ChannelsService,
    private readonly line: LineService,
    private readonly storage: StorageService,
    private readonly realtime: RealtimeGateway,
  ) {
    super();
  }

  async process(job: Job<WebhookJob>): Promise<void> {
    const { webhookEventId } = job.data;
    const evt = await this.prisma.webhookEvent.findUnique({ where: { id: webhookEventId } });
    if (!evt || evt.processStatus === 'done') return;

    await this.prisma.webhookEvent.update({
      where: { id: evt.id },
      data: { processStatus: 'processing' },
    });

    try {
      const channel = await this.channels.getDecryptedById(evt.lineChannelId!);
      const payload = evt.payloadJson as any;
      switch (payload.type) {
        case 'message':
          await this.handleMessage(channel, payload);
          break;
        case 'follow':
          await this.handleFollow(channel, payload);
          break;
        case 'unfollow':
          await this.handleUnfollow(channel, payload);
          break;
        case 'postback':
        default:
          this.logger.debug(`Unhandled event type ${payload.type}`);
      }
      await this.prisma.webhookEvent.update({
        where: { id: evt.id },
        data: { processStatus: 'done' },
      });
    } catch (err: any) {
      this.logger.error(`Webhook processing failed: ${err.message}`, err.stack);
      await this.prisma.webhookEvent.update({
        where: { id: evt.id },
        data: { processStatus: 'failed' },
      });
      throw err;
    }
  }

  private async findOrCreateContact(channel: any, lineUserId: string) {
    let contact = await this.prisma.contact.findUnique({
      where: { lineChannelId_lineUserId: { lineChannelId: channel.id, lineUserId } },
    });
    if (contact) return contact;

    const profile = await this.line.getProfile(channel.channelAccessToken, lineUserId);
    contact = await this.prisma.contact.create({
      data: {
        workspaceId: channel.workspaceId,
        lineChannelId: channel.id,
        lineUserId,
        displayName: profile?.displayName ?? null,
        pictureUrl: profile?.pictureUrl ?? null,
      },
    });
    return contact;
  }

  private async findOrCreateOpenConversation(channel: any, contactId: string) {
    const existing = await this.prisma.conversation.findFirst({
      where: { lineChannelId: channel.id, contactId, status: { not: 'closed' } },
      orderBy: { lastMessageAt: 'desc' },
    });
    if (existing) return existing;
    const conv = await this.prisma.conversation.create({
      data: {
        workspaceId: channel.workspaceId,
        lineChannelId: channel.id,
        contactId,
      },
    });
    this.realtime.emitWorkspace(channel.workspaceId, RT_EVENTS.ConversationNew, { id: conv.id });
    return conv;
  }

  private async handleMessage(channel: any, event: any) {
    const lineUserId = event.source?.userId;
    if (!lineUserId) return;

    const contact = await this.findOrCreateContact(channel, lineUserId);
    const conversation = await this.findOrCreateOpenConversation(channel, contact.id);

    const msg = event.message;
    const messageType = (msg?.type ?? 'text') as any;
    const lineMessageId: string | undefined = msg?.id;

    // dedupe — unique(lineChannelId, lineMessageId) handles double-fire
    const dup = lineMessageId
      ? await this.prisma.message.findUnique({
          where: { lineChannelId_lineMessageId: { lineChannelId: channel.id, lineMessageId } },
        })
      : null;
    if (dup) return;

    const message = await this.prisma.message.create({
      data: {
        workspaceId: channel.workspaceId,
        lineChannelId: channel.id,
        conversationId: conversation.id,
        contactId: contact.id,
        senderType: 'customer',
        direction: 'inbound',
        messageType,
        textContent: messageType === 'text' ? msg.text : null,
        lineMessageId: lineMessageId ?? null,
        replyToken: event.replyToken ?? null,
        rawPayload: event,
        sendStatus: 'sent',
      },
    });

    // Media
    if (['image', 'video', 'audio', 'file'].includes(messageType) && lineMessageId) {
      try {
        const { buffer, contentType } = await this.line.downloadContent(
          channel.channelAccessToken,
          lineMessageId,
        );
        const ext = (contentType?.split('/')[1] ?? 'bin').split(';')[0];
        const fileName = msg.fileName ?? `${messageType}-${lineMessageId}.${ext}`;
        const upload = await this.storage.uploadBuffer(
          `messages/${channel.id}/${conversation.id}`,
          buffer,
          { fileName, mimeType: contentType },
        );
        await this.prisma.messageAttachment.create({
          data: {
            messageId: message.id,
            fileName,
            fileType: messageType,
            mimeType: contentType,
            fileUrl: upload.url,
            fileSize: upload.size,
          },
        });
      } catch (err: any) {
        this.logger.warn(`media download/upload failed: ${err.message}`);
      }
    }

    await this.prisma.$transaction([
      this.prisma.contact.update({
        where: { id: contact.id },
        data: { lastMessageAt: new Date() },
      }),
      this.prisma.conversation.update({
        where: { id: conversation.id },
        data: {
          lastMessageAt: new Date(),
          unreadCount: { increment: 1 },
          status: conversation.status === 'closed' ? 'open' : conversation.status,
        },
      }),
    ]);

    const full = await this.prisma.message.findUnique({
      where: { id: message.id },
      include: { attachments: true },
    });

    this.realtime.emitConversation(conversation.id, RT_EVENTS.MessageNew, full);
    this.realtime.emitWorkspace(channel.workspaceId, RT_EVENTS.ConversationUpdated, {
      id: conversation.id,
      lastMessageAt: new Date().toISOString(),
    });
  }

  private async handleFollow(channel: any, event: any) {
    const lineUserId = event.source?.userId;
    if (!lineUserId) return;
    await this.findOrCreateContact(channel, lineUserId);
  }

  private async handleUnfollow(channel: any, event: any) {
    const lineUserId = event.source?.userId;
    if (!lineUserId) return;
    await this.prisma.contact.updateMany({
      where: { lineChannelId: channel.id, lineUserId },
      data: { status: 'blocked' },
    });
  }
}
