import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { MessagesService } from './messages.service';
import { MessagesController } from './messages.controller';
import { QUEUE_NAMES } from '../../common/constants/events';

@Module({
  imports: [BullModule.registerQueue({ name: QUEUE_NAMES.OutboundMessages })],
  providers: [MessagesService],
  controllers: [MessagesController],
  exports: [MessagesService],
})
export class MessagesModule {}
