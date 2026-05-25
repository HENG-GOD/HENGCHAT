import { Global, Module } from '@nestjs/common';
import { ChannelsService } from './channels.service';
import { ChannelsController } from './channels.controller';

@Global()
@Module({
  providers: [ChannelsService],
  controllers: [ChannelsController],
  exports: [ChannelsService],
})
export class ChannelsModule {}
