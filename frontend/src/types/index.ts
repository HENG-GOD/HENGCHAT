export type Role = 'owner' | 'admin' | 'supervisor' | 'agent';

export interface SessionAgent {
  id: string;
  workspaceId: string;
  name: string;
  email: string;
  role: Role;
}

export interface Agent {
  id: string;
  name: string;
  email: string;
  role: Role;
  isOnline?: boolean;
  lastSeenAt?: string | null;
  createdAt?: string;
}

export interface Channel {
  id: string;
  workspaceId: string;
  name: string;
  channelId: string;
  status: 'active' | 'disabled';
  webhookEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Contact {
  id: string;
  workspaceId: string;
  lineChannelId: string;
  lineUserId: string;
  displayName?: string;
  pictureUrl?: string;
  status: 'active' | 'blocked';
  lastMessageAt?: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface Note {
  id: string;
  conversationId: string;
  agentId: string;
  noteText: string;
  createdAt: string;
  agent?: { id: string; name: string };
}

export interface MessageAttachment {
  id: string;
  fileName?: string;
  fileType: string;
  mimeType?: string;
  fileUrl: string;
  thumbnailUrl?: string;
  fileSize?: number;
}

export interface Message {
  id: string;
  conversationId: string;
  senderType: 'customer' | 'agent' | 'system' | 'bot';
  senderId?: string | null;
  direction: 'inbound' | 'outbound';
  messageType: 'text' | 'image' | 'video' | 'audio' | 'file' | 'sticker' | 'location';
  textContent?: string | null;
  sendStatus: 'pending' | 'sent' | 'failed';
  createdAt: string;
  attachments?: MessageAttachment[];
}

export interface Conversation {
  id: string;
  workspaceId: string;
  lineChannelId: string;
  contactId: string;
  assignedAgentId?: string | null;
  status: 'open' | 'pending' | 'closed';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  unreadCount: number;
  lastMessageAt?: string;
  contact?: Contact;
  lineChannel?: Channel;
  assignedAgent?: { id: string; name: string };
  tags?: { tagId: string; tag: Tag }[];
  messages?: Message[];
}
