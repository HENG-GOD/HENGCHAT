import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { QUEUE_NAMES } from '../../common/constants/events';
import { WebhookProcessor } from './webhook.processor';
import { OutboundProcessor } from './outbound.processor';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: QUEUE_NAMES.WebhookEvents, defaultJobOptions: { attempts: 5, backoff: { type: 'exponential', delay: 2000 }, removeOnComplete: 1000, removeOnFail: 5000 } },
      { name: QUEUE_NAMES.OutboundMessages, defaultJobOptions: { attempts: 3, backoff: { type: 'exponential', delay: 1500 }, removeOnComplete: 500, removeOnFail: 5000 } },
      { name: QUEUE_NAMES.MediaDownload, defaultJobOptions: { attempts: 4, backoff: { type: 'exponential', delay: 2500 }, removeOnComplete: 500, removeOnFail: 5000 } },
    ),
  ],
  providers: [WebhookProcessor, OutboundProcessor],
  exports: [BullModule],
})
export class QueuesModule {}
