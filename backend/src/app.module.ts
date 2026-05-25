import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bullmq';
import configuration from './config/configuration';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { AgentsModule } from './modules/agents/agents.module';
import { WorkspacesModule } from './modules/workspaces/workspaces.module';
import { ChannelsModule } from './modules/channels/channels.module';
import { ContactsModule } from './modules/contacts/contacts.module';
import { ConversationsModule } from './modules/conversations/conversations.module';
import { MessagesModule } from './modules/messages/messages.module';
import { NotesModule } from './modules/notes/notes.module';
import { TagsModule } from './modules/tags/tags.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { LineModule } from './modules/line/line.module';
import { StorageModule } from './modules/storage/storage.module';
import { QueuesModule } from './modules/queues/queues.module';
import { RealtimeModule } from './modules/realtime/realtime.module';
import { ReportsModule } from './modules/reports/reports.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    BullModule.forRootAsync({
      useFactory: () => ({
        connection: {
          host: process.env.REDIS_HOST ?? 'localhost',
          port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
          password: process.env.REDIS_PASSWORD || undefined,
          // BullMQ requires this setting on all Redis connections
          maxRetriesPerRequest: null,
          // Upstash + most managed Redis providers require TLS
          ...(process.env.REDIS_TLS === 'true' ? { tls: {} } : {}),
        },
      }),
    }),
    PrismaModule,
    AuthModule,
    WorkspacesModule,
    AgentsModule,
    ChannelsModule,
    ContactsModule,
    ConversationsModule,
    MessagesModule,
    NotesModule,
    TagsModule,
    WebhooksModule,
    LineModule,
    StorageModule,
    QueuesModule,
    RealtimeModule,
    ReportsModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AppModule {}
