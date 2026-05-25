import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MessagesService } from './messages.service';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';
import { ListMessagesQueryDto, SendMessageDto } from './dto/message.dto';

@Controller()
export class MessagesController {
  constructor(private readonly messages: MessagesService) {}

  @Get('conversations/:id/messages')
  list(
    @CurrentUser() u: AuthUser,
    @Param('id') id: string,
    @Query() q: ListMessagesQueryDto,
  ) {
    const limit = q.limit ? parseInt(q.limit, 10) : 50;
    return this.messages.list(u.workspaceId, id, q.cursor, limit);
  }

  @Post('messages/send')
  send(@CurrentUser() u: AuthUser, @Body() dto: SendMessageDto) {
    return this.messages.send(u.workspaceId, u.id, dto);
  }

  @Post('messages/upload')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 25 * 1024 * 1024 } }))
  upload(@CurrentUser() u: AuthUser, @UploadedFile() file: Express.Multer.File) {
    return this.messages.upload(u.workspaceId, {
      buffer: file.buffer,
      mimeType: file.mimetype,
      originalname: file.originalname,
    });
  }
}
