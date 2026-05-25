import {
  BadRequestException,
  Controller,
  Headers,
  HttpCode,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Public } from '../../common/decorators/public.decorator';
import { QUEUE_NAMES } from '../../common/constants/events';
import { ChannelsService } from '../channels/channels.service';
import { verifyLineSignature } from '../../common/utils/crypto.util';
import { PrismaService } from '../../prisma/prisma.service';

interface LineWebhookBody {
  destination?: string;
  events: any[];
}

@Public()
@Controller('webhook')
export class WebhooksController {
  constructor(
    private readonly channels: ChannelsService,
    private readonly prisma: PrismaService,
    @InjectQueue(QUEUE_NAMES.WebhookEvents) private readonly queue: Queue,
  ) {}

  /**
   * LINE webhook endpoint. Channel resolved either by URL param (preferred) or by
   * `destination` field in body (LINE's bot user ID maps to our channelId).
   */
  @Post('line/:channelId')
  @HttpCode(200)
  async lineWebhookWithId(
    @Param('channelId') channelId: string,
    @Headers('x-line-signature') signature: string | undefined,
    @Req() req: Request,
  ) {
    return this.handle(channelId, signature, req);
  }

  @Post('line')
  @HttpCode(200)
  async lineWebhookGeneric(
    @Headers('x-line-signature') signature: string | undefined,
    @Req() req: Request,
  ) {
    const body = req.body as LineWebhookBody;
    if (!body?.destination) {
      throw new BadRequestException('Missing destination — use /webhook/line/:channelId');
    }
    return this.handle(body.destination, signature, req);
  }

  private async handle(channelId: string, signature: string | undefined, req: Request) {
    const channel = await this.channels.getDecryptedByChannelId(channelId);
    if (!channel || channel.status !== 'active' || !channel.webhookEnabled) {
      // ack 200 to avoid LINE retry storm; do not leak details
      return { ok: true };
    }

    const rawBody = (req as any).rawBody as Buffer | undefined;
    if (!rawBody || !verifyLineSignature(channel.channelSecret, rawBody, signature)) {
      throw new BadRequestException('Invalid signature');
    }

    const body = req.body as LineWebhookBody;
    const events = Array.isArray(body?.events) ? body.events : [];

    for (const event of events) {
      const eventId: string | undefined = event.webhookEventId ?? event.message?.id;
      try {
        const stored = await this.prisma.webhookEvent.upsert({
          where: {
            lineChannelId_eventId: {
              lineChannelId: channel.id,
              eventId: eventId ?? 'na',
            },
          },
          create: {
            workspaceId: channel.workspaceId,
            lineChannelId: channel.id,
            eventId: eventId ?? null,
            eventType: event.type ?? 'unknown',
            payloadJson: event,
            processStatus: 'pending',
          },
          update: {}, // duplicate — skip
        });

        if (stored.processStatus === 'pending') {
          await this.queue.add(
            'process',
            { webhookEventId: stored.id, lineChannelId: channel.id },
            { jobId: stored.id },
          );
        }
      } catch (err) {
        // Never fail the webhook response — LINE retries are noisy
      }
    }

    return { ok: true };
  }
}
