import { api } from '@/lib/api';
import type {
  Agent, Channel, Contact, Conversation, Message, Tag, Note, SessionAgent,
} from '@/types';

export const AuthApi = {
  login: (email: string, password: string) =>
    api.post<{ accessToken: string; refreshToken: string; agent: SessionAgent }>(
      '/auth/login', { email, password },
    ).then((r) => r.data),
  me: () => api.get<SessionAgent>('/auth/me').then((r) => r.data),
  logout: () => api.post('/auth/logout').then((r) => r.data),
};

export const ChannelsApi = {
  list: () => api.get<Channel[]>('/channels').then((r) => r.data),
  get: (id: string) => api.get<Channel>(`/channels/${id}`).then((r) => r.data),
  create: (data: Partial<Channel> & { channelSecret: string; channelAccessToken: string }) =>
    api.post<Channel>('/channels', data).then((r) => r.data),
  update: (id: string, data: any) => api.put<Channel>(`/channels/${id}`, data).then((r) => r.data),
  setStatus: (id: string, status: 'active' | 'disabled') =>
    api.patch<Channel>(`/channels/${id}/status`, { status }).then((r) => r.data),
};

export const AgentsApi = {
  list: () => api.get<Agent[]>('/agents').then((r) => r.data),
  create: (data: { name: string; email: string; password: string; role?: string }) =>
    api.post<Agent>('/agents', data).then((r) => r.data),
  update: (id: string, data: any) => api.put<Agent>(`/agents/${id}`, data).then((r) => r.data),
};

export const ConversationsApi = {
  list: (params: Record<string, any> = {}) =>
    api.get<{ items: Conversation[]; nextCursor: string | null }>('/conversations', { params })
       .then((r) => r.data),
  get: (id: string) => api.get<Conversation>(`/conversations/${id}`).then((r) => r.data),
  assign: (id: string, agentId: string | null) =>
    api.post(`/conversations/${id}/assign`, { agentId }).then((r) => r.data),
  close: (id: string) => api.post(`/conversations/${id}/close`).then((r) => r.data),
  reopen: (id: string) => api.post(`/conversations/${id}/reopen`).then((r) => r.data),
  markRead: (id: string) => api.post(`/conversations/${id}/read`).then((r) => r.data),
  addTag: (id: string, tagId: string) => api.post(`/conversations/${id}/tags`, { tagId }).then((r) => r.data),
  removeTag: (id: string, tagId: string) =>
    api.delete(`/conversations/${id}/tags/${tagId}`).then((r) => r.data),
};

export const MessagesApi = {
  list: (conversationId: string, cursor?: string) =>
    api.get<{ items: Message[]; nextCursor: string | null }>(
      `/conversations/${conversationId}/messages`,
      { params: { cursor } },
    ).then((r) => r.data),
  send: (data: { conversationId: string; messageType: 'text' | 'image'; text?: string; attachmentId?: string }) =>
    api.post<Message>('/messages/send', data).then((r) => r.data),
  upload: (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return api.post('/messages/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
              .then((r) => r.data);
  },
};

export const ContactsApi = {
  list: (params: Record<string, any> = {}) =>
    api.get<Contact[]>('/contacts', { params }).then((r) => r.data),
  get: (id: string) => api.get<Contact>(`/contacts/${id}`).then((r) => r.data),
  update: (id: string, data: any) => api.put<Contact>(`/contacts/${id}`, data).then((r) => r.data),
};

export const TagsApi = {
  list: () => api.get<Tag[]>('/tags').then((r) => r.data),
  create: (data: { name: string; color?: string }) => api.post<Tag>('/tags', data).then((r) => r.data),
  update: (id: string, data: any) => api.put<Tag>(`/tags/${id}`, data).then((r) => r.data),
  remove: (id: string) => api.delete(`/tags/${id}`).then((r) => r.data),
};

export const NotesApi = {
  list: (conversationId: string) =>
    api.get<Note[]>(`/conversations/${conversationId}/notes`).then((r) => r.data),
  create: (conversationId: string, noteText: string) =>
    api.post<Note>(`/conversations/${conversationId}/notes`, { noteText }).then((r) => r.data),
};

export const ReportsApi = {
  summary: () => api.get<any>('/reports/summary').then((r) => r.data),
  agents: () => api.get<any[]>('/reports/agents').then((r) => r.data),
  channels: () => api.get<any[]>('/reports/channels').then((r) => r.data),
};
