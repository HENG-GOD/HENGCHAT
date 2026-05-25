import { Body, Controller, Get, Param, Put, Query } from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';

@Controller('contacts')
export class ContactsController {
  constructor(private readonly contacts: ContactsService) {}

  @Get()
  list(
    @CurrentUser() u: AuthUser,
    @Query('channelId') channelId?: string,
    @Query('keyword') keyword?: string,
  ) {
    return this.contacts.list(u.workspaceId, { channelId, keyword });
  }

  @Get(':id')
  get(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    return this.contacts.get(u.workspaceId, id);
  }

  @Put(':id')
  update(
    @CurrentUser() u: AuthUser,
    @Param('id') id: string,
    @Body() body: { displayName?: string; status?: 'active' | 'blocked' },
  ) {
    return this.contacts.update(u.workspaceId, id, body);
  }
}
