import { Body, Controller, Delete, Get, Module, Param, Post, Put, UseGuards } from '@nestjs/common';
import { IsHexColor, IsOptional, IsString, MinLength } from 'class-validator';
import { PrismaService } from '../../prisma/prisma.service';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/constants/roles.enum';
import { RolesGuard } from '../../common/guards/roles.guard';

class TagDto {
  @IsString() @MinLength(1) name!: string;
  @IsOptional() @IsHexColor() color?: string;
}

@UseGuards(RolesGuard)
@Controller('tags')
class TagsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  list(@CurrentUser() u: AuthUser) {
    return this.prisma.tag.findMany({
      where: { workspaceId: u.workspaceId },
      orderBy: { name: 'asc' },
    });
  }

  @Roles(Role.Admin)
  @Post()
  create(@CurrentUser() u: AuthUser, @Body() dto: TagDto) {
    return this.prisma.tag.create({
      data: { workspaceId: u.workspaceId, name: dto.name, color: dto.color ?? '#64748b' },
    });
  }

  @Roles(Role.Admin)
  @Put(':id')
  update(@CurrentUser() u: AuthUser, @Param('id') id: string, @Body() dto: TagDto) {
    return this.prisma.tag.updateMany({
      where: { id, workspaceId: u.workspaceId },
      data: { name: dto.name, color: dto.color },
    });
  }

  @Roles(Role.Admin)
  @Delete(':id')
  remove(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    return this.prisma.tag.deleteMany({ where: { id, workspaceId: u.workspaceId } });
  }
}

@Module({ controllers: [TagsController] })
export class TagsModule {}
