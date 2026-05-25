import { Body, Controller, Get, Module, Param, Post } from '@nestjs/common';
import { IsString, MinLength } from 'class-validator';
import { PrismaService } from '../../prisma/prisma.service';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';

class CreateNoteDto {
  @IsString() @MinLength(1) noteText!: string;
}

@Controller('conversations/:id/notes')
class NotesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  list(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    return this.prisma.note.findMany({
      where: { conversationId: id, conversation: { workspaceId: u.workspaceId } },
      include: { agent: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Post()
  create(@CurrentUser() u: AuthUser, @Param('id') id: string, @Body() dto: CreateNoteDto) {
    return this.prisma.note.create({
      data: { conversationId: id, agentId: u.id, noteText: dto.noteText },
    });
  }
}

@Module({ controllers: [NotesController] })
export class NotesModule {}
