import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { RT_EVENTS } from '../../common/constants/events';

interface SocketUser {
  id: string;
  workspaceId: string;
  role: string;
}

@WebSocketGateway({ cors: { origin: true, credentials: true }, path: '/socket.io' })
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() io!: Server;
  private readonly logger = new Logger('Realtime');

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        (client.handshake.auth?.token as string) ??
        (client.handshake.headers['authorization'] as string)?.replace(/^Bearer /, '');
      const payload: any = await this.jwt.verifyAsync(token, {
        secret: this.config.get<string>('jwt.secret'),
      });
      const user: SocketUser = {
        id: payload.sub,
        workspaceId: payload.workspaceId,
        role: payload.role,
      };
      (client.data as any).user = user;
      client.join(`workspace:${user.workspaceId}`);
      client.join(`agent:${user.id}`);
      await this.prisma.agent.update({
        where: { id: user.id },
        data: { isOnline: true, lastSeenAt: new Date() },
      });
      this.io.to(`workspace:${user.workspaceId}`).emit(RT_EVENTS.AgentOnline, { id: user.id });
    } catch (err: any) {
      this.logger.warn(`Auth failed: ${err.message}`);
      client.disconnect(true);
    }
  }

  async handleDisconnect(client: Socket) {
    const user = (client.data as any).user as SocketUser | undefined;
    if (!user) return;
    await this.prisma.agent.update({
      where: { id: user.id },
      data: { isOnline: false, lastSeenAt: new Date() },
    });
    this.io.to(`workspace:${user.workspaceId}`).emit(RT_EVENTS.AgentOffline, { id: user.id });
  }

  @SubscribeMessage('conversation:join')
  joinConversation(@ConnectedSocket() client: Socket, @MessageBody() body: { conversationId: string }) {
    client.join(`conversation:${body.conversationId}`);
    return { ok: true };
  }

  @SubscribeMessage('conversation:leave')
  leaveConversation(@ConnectedSocket() client: Socket, @MessageBody() body: { conversationId: string }) {
    client.leave(`conversation:${body.conversationId}`);
    return { ok: true };
  }

  @SubscribeMessage('typing:start')
  typingStart(@ConnectedSocket() client: Socket, @MessageBody() body: { conversationId: string }) {
    const user = (client.data as any).user as SocketUser;
    this.io
      .to(`conversation:${body.conversationId}`)
      .except(client.id)
      .emit(RT_EVENTS.TypingStart, { conversationId: body.conversationId, agentId: user.id });
  }

  @SubscribeMessage('typing:stop')
  typingStop(@ConnectedSocket() client: Socket, @MessageBody() body: { conversationId: string }) {
    const user = (client.data as any).user as SocketUser;
    this.io
      .to(`conversation:${body.conversationId}`)
      .except(client.id)
      .emit(RT_EVENTS.TypingStop, { conversationId: body.conversationId, agentId: user.id });
  }

  // ---- emit helpers ----
  emitWorkspace(workspaceId: string, event: string, data: any) {
    this.io?.to(`workspace:${workspaceId}`).emit(event, data);
  }
  emitConversation(conversationId: string, event: string, data: any) {
    this.io?.to(`conversation:${conversationId}`).emit(event, data);
  }
  emitAgent(agentId: string, event: string, data: any) {
    this.io?.to(`agent:${agentId}`).emit(event, data);
  }
}
