import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { encryptSecret, decryptSecret } from '../../common/utils/crypto.util';
import { CreateChannelDto, UpdateChannelDto } from './dto/channel.dto';

@Injectable()
export class ChannelsService {
  constructor(private readonly prisma: PrismaService) {}

  private serialize(c: any) {
    return {
      id: c.id,
      workspaceId: c.workspaceId,
      name: c.name,
      channelId: c.channelId,
      status: c.status,
      webhookEnabled: c.webhookEnabled,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    };
  }

  list(workspaceId: string) {
    return this.prisma.lineChannel
      .findMany({ where: { workspaceId }, orderBy: { createdAt: 'desc' } })
      .then((rows) => rows.map(this.serialize));
  }

  async get(workspaceId: string, id: string) {
    const c = await this.prisma.lineChannel.findFirst({ where: { id, workspaceId } });
    if (!c) throw new NotFoundException('Channel not found');
    return this.serialize(c);
  }

  /**
   * Fetch the channel including decrypted secrets. INTERNAL use only — never expose over HTTP.
   */
  async getDecryptedById(id: string) {
    const c = await this.prisma.lineChannel.findUnique({ where: { id } });
    if (!c) throw new NotFoundException('Channel not found');
    return {
      ...c,
      channelSecret: decryptSecret(c.channelSecret),
      channelAccessToken: decryptSecret(c.channelAccessToken),
    };
  }

  async getDecryptedByChannelId(channelId: string) {
    const c = await this.prisma.lineChannel.findUnique({ where: { channelId } });
    if (!c) return null;
    return {
      ...c,
      channelSecret: decryptSecret(c.channelSecret),
      channelAccessToken: decryptSecret(c.channelAccessToken),
    };
  }

  async create(workspaceId: string, dto: CreateChannelDto) {
    const exists = await this.prisma.lineChannel.findUnique({ where: { channelId: dto.channelId } });
    if (exists) throw new ConflictException('channelId already exists');
    const c = await this.prisma.lineChannel.create({
      data: {
        workspaceId,
        name: dto.name,
        channelId: dto.channelId,
        channelSecret: encryptSecret(dto.channelSecret),
        channelAccessToken: encryptSecret(dto.channelAccessToken),
        webhookEnabled: dto.webhookEnabled ?? true,
      },
    });
    return this.serialize(c);
  }

  async update(workspaceId: string, id: string, dto: UpdateChannelDto) {
    await this.get(workspaceId, id);
    const data: any = {};
    if (dto.name) data.name = dto.name;
    if (dto.channelSecret) data.channelSecret = encryptSecret(dto.channelSecret);
    if (dto.channelAccessToken) data.channelAccessToken = encryptSecret(dto.channelAccessToken);
    if (typeof dto.webhookEnabled === 'boolean') data.webhookEnabled = dto.webhookEnabled;
    const c = await this.prisma.lineChannel.update({ where: { id }, data });
    return this.serialize(c);
  }

  async setStatus(workspaceId: string, id: string, status: 'active' | 'disabled') {
    await this.get(workspaceId, id);
    const c = await this.prisma.lineChannel.update({
      where: { id },
      data: { status: status as any },
    });
    return this.serialize(c);
  }
}
