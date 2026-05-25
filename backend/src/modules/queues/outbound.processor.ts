import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { ChannelsService } from '../channels/channels.service';
import { LineService, LineOutboundMessage } from '../line/line.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { QUEUE_NAMES, RT_EVENTS } from '../../common/constants/events';

interface OutboundJob {
  messageId: string;
}

@Processor(QUEUE_NAMES.OutboundMessages, { concurrency: 16 })
export class OutboundProcessor extends WorkerHost {
  private readonly logger = new Logger(OutboundProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly channels: ChannelsService,
    private readonly line: LineService,
    private readonly realtime: RealtimeGateway,
  ) {
    super();
  }

  async process(job: Job<OutboundJob>) {
    const { messageId } = job.data;
    const msg = await this.prisma.message.findUnique({
      where: { id: messageId },
      include: { conversation: { include: { contact: true } } },
    });
    if (!msg) return;

    const channel = await this.channels.getDecryptedById(msg.lineChannelId);
    const to = msg.conversation.contact.lineUserId;

    const outbound: LineOutboundMessage[] = [];
    if (msg.messageType === 'text' && msg.textContent) {
      outbound.push({ type: 'text', text: msg.textContent });
    } else if (msg.messageType === 'image') {
      const attachments = await this.prisma.messageAttachment.findMany({
        where: { messageId: msg.id },
      });
      const a = attachments[0];
      if (a) outbound.push({
        type: 'image',
        originalContentUrl: a.fileUrl,
        previewImageUrl: a.thumbnailUrl ?? a.fileUrl,
      });
    }
    if (!outbound.length) {
      await this.markFailed(msg.id, 'No deliverable content');
      return;
    }

    const result = await this.line.pushMessage(channel.channelAccessToken, to, outbound);

    await this.prisma.messageSendLog.create({
      data: {
        messageId: msg.id,
        requestPayload: result.payload,
        responsePayload: result.data,
        statusCode: result.status,
        status: result.status >= 200 && result.status < 300 ? 'success' : 'error',
      },
    });

    if (result.status >= 200 && result.status < 300) {
      await this.prisma.message.update({
        where: { id: msg.id },
        data: { sendStatus: 'sent' },
      });
      this.realtime.emitConversation(msg.conversationId, RT_EVENTS.MessageSent, { id: msg.id });
    } else {
      await this.markFailed(msg.id, `LINE API ${result.status}`);
    }
  }

  private async markFailed(messageId: string, reason: string) {
    await this.prisma.message.update({
      where: { id: messageId },
      data: { sendStatus: 'failed' },
    });
    const msg = await this.prisma.message.findUnique({ where: { id: messageId } });
    if (msg) {
      this.realtime.emitConversation(msg.conversationId, RT_EVENTS.MessageFailed, {
        id: msg.id,
        reason,
      });
    }
  }
}
