import { Body, Controller, Get, Param, Patch, Post, Put, UseGuards } from '@nestjs/common';
import { AgentsService } from './agents.service';
import { CreateAgentDto, UpdateAgentDto, UpdateAgentStatusDto } from './dto/create-agent.dto';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/constants/roles.enum';
import { RolesGuard } from '../../common/guards/roles.guard';

@UseGuards(RolesGuard)
@Controller('agents')
export class AgentsController {
  constructor(private readonly agents: AgentsService) {}

  @Get()
  list(@CurrentUser() u: AuthUser) {
    return this.agents.list(u.workspaceId);
  }

  @Get(':id')
  get(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    return this.agents.get(u.workspaceId, id);
  }

  @Roles(Role.Admin)
  @Post()
  create(@CurrentUser() u: AuthUser, @Body() dto: CreateAgentDto) {
    return this.agents.create(u.workspaceId, dto);
  }

  @Roles(Role.Admin)
  @Put(':id')
  update(@CurrentUser() u: AuthUser, @Param('id') id: string, @Body() dto: UpdateAgentDto) {
    return this.agents.update(u.workspaceId, id, dto, u.role as Role);
  }

  @Patch(':id/status')
  status(@Param('id') id: string, @Body() dto: UpdateAgentStatusDto) {
    return this.agents.setOnline(id, dto.status === 'online');
  }
}
