export const RT_EVENTS = {
  ConversationNew: 'conversation:new',
  ConversationUpdated: 'conversation:updated',
  ConversationAssigned: 'conversation:assigned',
  ConversationClosed: 'conversation:closed',
  MessageNew: 'message:new',
  MessageSent: 'message:sent',
  MessageFailed: 'message:failed',
  AgentOnline: 'agent:online',
  AgentOffline: 'agent:offline',
  TypingStart: 'typing:start',
  TypingStop: 'typing:stop',
} as const;

export const QUEUE_NAMES = {
  WebhookEvents: 'webhook-events',
  OutboundMessages: 'outbound-messages',
  MediaDownload: 'media-download',
} as const;
