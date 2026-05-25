-- CreateEnum
CREATE TYPE "WorkspaceStatus" AS ENUM ('active', 'suspended');

-- CreateEnum
CREATE TYPE "AgentRole" AS ENUM ('owner', 'admin', 'supervisor', 'agent');

-- CreateEnum
CREATE TYPE "ChannelStatus" AS ENUM ('active', 'disabled');

-- CreateEnum
CREATE TYPE "ContactStatus" AS ENUM ('active', 'blocked');

-- CreateEnum
CREATE TYPE "ConversationStatus" AS ENUM ('open', 'pending', 'closed');

-- CreateEnum
CREATE TYPE "ConversationPriority" AS ENUM ('low', 'normal', 'high', 'urgent');

-- CreateEnum
CREATE TYPE "SenderType" AS ENUM ('customer', 'agent', 'system', 'bot');

-- CreateEnum
CREATE TYPE "MessageDirection" AS ENUM ('inbound', 'outbound');

-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('text', 'image', 'video', 'audio', 'file', 'sticker', 'location');

-- CreateEnum
CREATE TYPE "SendStatus" AS ENUM ('pending', 'sent', 'failed');

-- CreateEnum
CREATE TYPE "WebhookProcessStatus" AS ENUM ('pending', 'processing', 'done', 'failed');

-- CreateTable
CREATE TABLE "workspaces" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "WorkspaceStatus" NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workspaces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agents" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "AgentRole" NOT NULL DEFAULT 'agent',
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "lastSeenAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "line_channels" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "channelSecret" TEXT NOT NULL,
    "channelAccessToken" TEXT NOT NULL,
    "status" "ChannelStatus" NOT NULL DEFAULT 'active',
    "webhookEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "line_channels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contacts" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "lineChannelId" TEXT NOT NULL,
    "lineUserId" TEXT NOT NULL,
    "displayName" TEXT,
    "pictureUrl" TEXT,
    "status" "ContactStatus" NOT NULL DEFAULT 'active',
    "lastMessageAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversations" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "lineChannelId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "assignedAgentId" TEXT,
    "status" "ConversationStatus" NOT NULL DEFAULT 'open',
    "priority" "ConversationPriority" NOT NULL DEFAULT 'normal',
    "unreadCount" INTEGER NOT NULL DEFAULT 0,
    "lastMessageAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "lineChannelId" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "contactId" TEXT,
    "senderType" "SenderType" NOT NULL,
    "senderId" TEXT,
    "direction" "MessageDirection" NOT NULL,
    "messageType" "MessageType" NOT NULL,
    "textContent" TEXT,
    "lineMessageId" TEXT,
    "replyToken" TEXT,
    "sendStatus" "SendStatus" NOT NULL DEFAULT 'sent',
    "rawPayload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_attachments" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "fileName" TEXT,
    "fileType" TEXT NOT NULL,
    "mimeType" TEXT,
    "fileUrl" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "fileSize" INTEGER,
    "width" INTEGER,
    "height" INTEGER,
    "duration" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "message_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#64748b',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversation_tags" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversation_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notes" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "noteText" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_events" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT,
    "lineChannelId" TEXT,
    "eventId" TEXT,
    "eventType" TEXT NOT NULL,
    "payloadJson" JSONB NOT NULL,
    "processStatus" "WebhookProcessStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_send_logs" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "requestPayload" JSONB NOT NULL,
    "responsePayload" JSONB,
    "statusCode" INTEGER,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_send_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "agents_email_key" ON "agents"("email");

-- CreateIndex
CREATE INDEX "agents_workspaceId_idx" ON "agents"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "line_channels_channelId_key" ON "line_channels"("channelId");

-- CreateIndex
CREATE INDEX "line_channels_workspaceId_idx" ON "line_channels"("workspaceId");

-- CreateIndex
CREATE INDEX "contacts_workspaceId_idx" ON "contacts"("workspaceId");

-- CreateIndex
CREATE INDEX "contacts_lineChannelId_lineUserId_idx" ON "contacts"("lineChannelId", "lineUserId");

-- CreateIndex
CREATE UNIQUE INDEX "contacts_lineChannelId_lineUserId_key" ON "contacts"("lineChannelId", "lineUserId");

-- CreateIndex
CREATE INDEX "conversations_lineChannelId_lastMessageAt_idx" ON "conversations"("lineChannelId", "lastMessageAt" DESC);

-- CreateIndex
CREATE INDEX "conversations_status_assignedAgentId_lastMessageAt_idx" ON "conversations"("status", "assignedAgentId", "lastMessageAt" DESC);

-- CreateIndex
CREATE INDEX "conversations_workspaceId_status_idx" ON "conversations"("workspaceId", "status");

-- CreateIndex
CREATE INDEX "messages_conversationId_createdAt_idx" ON "messages"("conversationId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "messages_workspaceId_createdAt_idx" ON "messages"("workspaceId", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "messages_lineChannelId_lineMessageId_key" ON "messages"("lineChannelId", "lineMessageId");

-- CreateIndex
CREATE INDEX "message_attachments_messageId_idx" ON "message_attachments"("messageId");

-- CreateIndex
CREATE UNIQUE INDEX "tags_workspaceId_name_key" ON "tags"("workspaceId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "conversation_tags_conversationId_tagId_key" ON "conversation_tags"("conversationId", "tagId");

-- CreateIndex
CREATE INDEX "notes_conversationId_createdAt_idx" ON "notes"("conversationId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "webhook_events_processStatus_createdAt_idx" ON "webhook_events"("processStatus", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "webhook_events_lineChannelId_eventId_key" ON "webhook_events"("lineChannelId", "eventId");

-- CreateIndex
CREATE INDEX "message_send_logs_messageId_idx" ON "message_send_logs"("messageId");

-- AddForeignKey
ALTER TABLE "agents" ADD CONSTRAINT "agents_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "line_channels" ADD CONSTRAINT "line_channels_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_lineChannelId_fkey" FOREIGN KEY ("lineChannelId") REFERENCES "line_channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_lineChannelId_fkey" FOREIGN KEY ("lineChannelId") REFERENCES "line_channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_assignedAgentId_fkey" FOREIGN KEY ("assignedAgentId") REFERENCES "agents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_lineChannelId_fkey" FOREIGN KEY ("lineChannelId") REFERENCES "line_channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_attachments" ADD CONSTRAINT "message_attachments_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tags" ADD CONSTRAINT "tags_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_tags" ADD CONSTRAINT "conversation_tags_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_tags" ADD CONSTRAINT "conversation_tags_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "agents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhook_events" ADD CONSTRAINT "webhook_events_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhook_events" ADD CONSTRAINT "webhook_events_lineChannelId_fkey" FOREIGN KEY ("lineChannelId") REFERENCES "line_channels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_send_logs" ADD CONSTRAINT "message_send_logs_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
