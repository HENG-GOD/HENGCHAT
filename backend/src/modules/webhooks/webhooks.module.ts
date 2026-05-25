import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { WebhooksController } from './webhooks.controller';
import { QUEUE_NAMES } from '../../common/constants/events';

@Module({
  imports: [BullModule.registerQueue({ name: QUEUE_NAMES.WebhookEvents })],
  controllers: [WebhooksController],
})
export class WebhooksModule {}
