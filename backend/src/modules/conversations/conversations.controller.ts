import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';
import { AddTagDto, AssignDto, ListConversationsQueryDto } from './dto/conversation.dto';
import { Role } from '../../common/constants/roles.enum';

@Controller('conversations')
export class ConversationsController {
  constructor(private readonly conversations: ConversationsService) {}

  @Get()
  list(@CurrentUser() u: AuthUser, @Query() q: ListConversationsQueryDto) {
    return this.conversations.list(
      u.workspaceId,
      {
        channelId: q.channelId,
        assignedAgentId: q.assignedAgentId,
        status: q.status,
        unreadOnly: q.unreadOnly === 'true',
        keyword: q.keyword,
        tagId: q.tagId,
        cursor: q.cursor,
        limit: q.limit ? parseInt(q.limit, 10) : undefined,
      },
      { id: u.id, role: u.role as Role },
    );
  }

  @Get(':id')
  get(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    return this.conversations.get(u.workspaceId, id, { id: u.id, role: u.role as Role });
  }

  @Post(':id/assign')
  assign(@CurrentUser() u: AuthUser, @Param('id') id: string, @Body() dto: AssignDto) {
    return this.conversations.assign(u.workspaceId, id, dto.agentId);
  }

  @Post(':id/close')
  close(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    return this.conversations.setStatus(u.workspaceId, id, 'closed');
  }

  @Post(':id/reopen')
  reopen(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    return this.conversations.setStatus(u.workspaceId, id, 'open');
  }

  @Post(':id/read')
  read(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    return this.conversations.markRead(u.workspaceId, id);
  }

  @Post(':id/tags')
  addTag(@CurrentUser() u: AuthUser, @Param('id') id: string, @Body() dto: AddTagDto) {
    return this.conversations.addTag(u.workspaceId, id, dto.tagId);
  }

  @Delete(':id/tags/:tagId')
  removeTag(
    @CurrentUser() u: AuthUser,
    @Param('id') id: string,
    @Param('tagId') tagId: string,
  ) {
    return this.conversations.removeTag(u.workspaceId, id, tagId);
  }
}
