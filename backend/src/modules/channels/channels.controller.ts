import { Body, Controller, Get, Param, Patch, Post, Put, UseGuards } from '@nestjs/common';
import { ChannelsService } from './channels.service';
import { CreateChannelDto, UpdateChannelDto, UpdateChannelStatusDto } from './dto/channel.dto';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/constants/roles.enum';
import { RolesGuard } from '../../common/guards/roles.guard';

@UseGuards(RolesGuard)
@Controller('channels')
export class ChannelsController {
  constructor(private readonly channels: ChannelsService) {}

  @Get()
  list(@CurrentUser() u: AuthUser) {
    return this.channels.list(u.workspaceId);
  }

  @Get(':id')
  get(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    return this.channels.get(u.workspaceId, id);
  }

  @Roles(Role.Admin)
  @Post()
  create(@CurrentUser() u: AuthUser, @Body() dto: CreateChannelDto) {
    return this.channels.create(u.workspaceId, dto);
  }

  @Roles(Role.Admin)
  @Put(':id')
  update(@CurrentUser() u: AuthUser, @Param('id') id: string, @Body() dto: UpdateChannelDto) {
    return this.channels.update(u.workspaceId, id, dto);
  }

  @Roles(Role.Admin)
  @Patch(':id/status')
  status(
    @CurrentUser() u: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateChannelStatusDto,
  ) {
    return this.channels.setStatus(u.workspaceId, id, dto.status);
  }
}
