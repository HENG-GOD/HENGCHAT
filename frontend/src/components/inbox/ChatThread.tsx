'use client';

import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Send, Paperclip } from 'lucide-react';
import { MessagesApi, ConversationsApi } from '@/services';
import { getSocket } from '@/lib/socket';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Input';
import { MessageBubble } from './MessageBubble';
import { cn } from '@/lib/cn';
import type { Conversation, Message } from '@/types';

export function ChatThread({ conversation }: { conversation: Conversation }) {
  const qc = useQueryClient();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['messages', conversation.id],
    queryFn: () => MessagesApi.list(conversation.id),
  });

  useEffect(() => {
    const socket = getSocket();
    socket.emit('conversation:join', { conversationId: conversation.id });
    const onNew = (m: Message) => {
      if (m.conversationId !== conversation.id) return;
      qc.setQueryData<{ items: Message[]; nextCursor: string | null }>(
        ['messages', conversation.id],
        (prev) => prev ? { ...prev, items: [...prev.items, m] } : { items: [m], nextCursor: null },
      );
    };
    socket.on('message:new', onNew);
    socket.on('message:sent',   () => qc.invalidateQueries({ queryKey: ['messages', conversation.id] }));
    socket.on('message:failed', () => qc.invalidateQueries({ queryKey: ['messages', conversation.id] }));
    ConversationsApi.markRead(conversation.id).catch(() => {});
    return () => {
      socket.emit('conversation:leave', { conversationId: conversation.id });
      socket.off('message:new', onNew);
    };
  }, [conversation.id, qc]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [data?.items.length]);

  async function send() {
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      await MessagesApi.send({
        conversationId: conversation.id,
        messageType: 'text',
        text: text.trim(),
      });
      setText('');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-full flex-col bg-bg">
      {/* Header */}
      <div className="flex h-12 items-center justify-between border-b border-border bg-bg-elevated px-4">
        <div className="flex items-center gap-2.5">
          <Avatar
            src={conversation.contact?.pictureUrl}
            name={conversation.contact?.displayName}
            size="sm"
          />
          <div>
            <div className="text-sm font-semibold text-fg leading-tight">
              {conversation.contact?.displayName ?? conversation.contact?.lineUserId}
            </div>
            <div className="text-2xs text-fg-subtle">{conversation.lineChannel?.name}</div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Badge variant={conversation.status === 'open' ? 'brand' : conversation.status === 'closed' ? 'danger' : 'warning'}>
            {conversation.status}
          </Badge>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 space-y-1.5 overflow-y-auto bg-bg px-4 py-4">
        {isLoading && (
          <div className="flex h-full items-center justify-center text-sm text-fg-subtle">
            Loading messages…
          </div>
        )}
        {data?.items.map((m) => <MessageBubble key={m.id} m={m} />)}
      </div>

      {/* Composer */}
      <div className="border-t border-border bg-bg-elevated p-3">
        <div className={cn(
          'flex items-end gap-2 rounded-lg border border-border bg-bg p-2',
          'focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20 transition-colors',
        )}>
          <button
            type="button"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-fg-subtle hover:bg-bg-muted hover:text-fg transition-colors"
            title="Attach (coming soon)"
            disabled
          >
            <Paperclip className="h-4 w-4" />
          </button>
          <Textarea
            rows={1}
            placeholder={conversation.status === 'closed' ? 'Conversation is closed — reopen to reply' : 'Type a reply…  (Enter to send · Shift+Enter for newline)'}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
            }}
            disabled={conversation.status === 'closed'}
            className="border-0 px-1 py-1 focus-visible:ring-0 focus-visible:border-0 max-h-32"
            style={{ minHeight: '28px' }}
          />
          <Button
            size="icon"
            onClick={send}
            disabled={!text.trim() || sending || conversation.status === 'closed'}
            title="Send"
          >
            <Send className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
