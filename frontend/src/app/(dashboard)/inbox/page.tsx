'use client';

import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, MessageSquare } from 'lucide-react';
import { ChannelsApi, ConversationsApi } from '@/services';
import { ConversationList } from '@/components/inbox/ConversationList';
import { ChatThread } from '@/components/inbox/ChatThread';
import { ContactPanel } from '@/components/inbox/ContactPanel';
import { Input, Select } from '@/components/ui/Input';
import { getSocket } from '@/lib/socket';
import { cn } from '@/lib/cn';
import type { Conversation } from '@/types';

type StatusFilter = '' | 'open' | 'pending' | 'closed';

const segments: { value: StatusFilter; label: string }[] = [
  { value: 'open',    label: 'Open' },
  { value: 'pending', label: 'Pending' },
  { value: 'closed',  label: 'Closed' },
  { value: '',        label: 'All' },
];

export default function InboxPage() {
  const qc = useQueryClient();
  const channels = useQuery({ queryKey: ['channels'], queryFn: ChannelsApi.list });
  const [activeId, setActiveId] = useState<string | undefined>();
  const [filters, setFilters] = useState<{
    status?: 'open' | 'pending' | 'closed';
    channelId?: string;
    unreadOnly?: boolean;
    keyword?: string;
  }>({ status: 'open' });

  const activeConv = useQuery({
    queryKey: ['conversation', activeId],
    queryFn: () => (activeId ? ConversationsApi.get(activeId) : null),
    enabled: !!activeId,
  });

  useEffect(() => {
    const s = getSocket();
    const refetchList = () => qc.invalidateQueries({ queryKey: ['conversations'] });
    s.on('conversation:new', refetchList);
    s.on('conversation:updated', refetchList);
    s.on('conversation:assigned', refetchList);
    s.on('conversation:closed', refetchList);
    return () => {
      s.off('conversation:new', refetchList);
      s.off('conversation:updated', refetchList);
      s.off('conversation:assigned', refetchList);
      s.off('conversation:closed', refetchList);
    };
  }, [qc]);

  return (
    <div className="flex h-full">
      {/* Left: filters + conversation list */}
      <section className="flex w-[320px] shrink-0 flex-col border-r border-border bg-bg-elevated">
        {/* Header */}
        <div className="flex h-12 items-center justify-between border-b border-border px-3">
          <h2 className="text-sm font-semibold text-fg">Inbox</h2>
          <span className="text-2xs text-fg-subtle">
            {channels.data?.length ?? 0} channel{(channels.data?.length ?? 0) !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Segments */}
        <div className="flex border-b border-border px-2 pt-2 gap-0.5">
          {segments.map((s) => {
            const active = filters.status === (s.value || undefined) || (s.value === '' && filters.status === undefined);
            return (
              <button
                key={s.value}
                onClick={() => setFilters((f) => ({ ...f, status: (s.value || undefined) as any }))}
                className={cn(
                  'flex-1 px-2 py-1.5 text-xs font-medium rounded-md transition-colors',
                  active
                    ? 'bg-bg-muted text-fg'
                    : 'text-fg-muted hover:bg-bg-muted/50',
                )}
              >
                {s.label}
              </button>
            );
          })}
        </div>

        {/* Filters */}
        <div className="space-y-2 border-b border-border p-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-fg-subtle" />
            <Input
              placeholder="Search…"
              className="pl-7 h-7 text-xs"
              onChange={(e) => setFilters((f) => ({ ...f, keyword: e.target.value }))}
            />
          </div>
          <div className="flex gap-1.5">
            <Select
              className="h-7 text-xs flex-1"
              value={filters.channelId ?? ''}
              onChange={(e) => setFilters((f) => ({ ...f, channelId: e.target.value || undefined }))}
            >
              <option value="">All channels</option>
              {channels.data?.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
            <label className={cn(
              'flex h-7 items-center gap-1 rounded-md border border-border bg-bg-elevated px-2 text-xs cursor-pointer',
              filters.unreadOnly && 'border-brand-500 bg-brand-500/5',
            )}>
              <input
                type="checkbox"
                className="h-3 w-3 accent-brand-500"
                checked={!!filters.unreadOnly}
                onChange={(e) => setFilters((f) => ({ ...f, unreadOnly: e.target.checked }))}
              />
              Unread
            </label>
          </div>
        </div>

        <ConversationList
          activeId={activeId}
          onSelect={(c: Conversation) => setActiveId(c.id)}
          filters={filters}
        />
      </section>

      {/* Center: thread */}
      <section className="flex-1 min-w-0">
        {activeConv.data ? (
          <ChatThread conversation={activeConv.data} />
        ) : (
          <div className="flex h-full flex-col items-center justify-center bg-bg text-center">
            <div className="rounded-full bg-bg-muted p-4 mb-3">
              <MessageSquare className="h-6 w-6 text-fg-subtle" />
            </div>
            <p className="text-sm font-medium text-fg">No conversation selected</p>
            <p className="mt-1 text-xs text-fg-subtle">Pick a chat from the left to start replying</p>
          </div>
        )}
      </section>

      {/* Right: contact panel */}
      <aside className="w-80 shrink-0 border-l border-border bg-bg-subtle">
        {activeConv.data ? (
          <ContactPanel conversation={activeConv.data} />
        ) : (
          <div className="p-6 text-center">
            <p className="text-xs text-fg-subtle">Contact details will appear here</p>
          </div>
        )}
      </aside>
    </div>
  );
}
