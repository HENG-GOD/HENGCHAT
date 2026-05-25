'use client';

import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNowStrict } from 'date-fns';
import { ConversationsApi } from '@/services';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/cn';
import type { Conversation } from '@/types';

interface Props {
  activeId?: string;
  onSelect: (c: Conversation) => void;
  filters: {
    status?: 'open' | 'pending' | 'closed';
    channelId?: string;
    unreadOnly?: boolean;
    keyword?: string;
  };
}

export function ConversationList({ activeId, onSelect, filters }: Props) {
  const { data, isLoading } = useQuery({
    queryKey: ['conversations', filters],
    queryFn: () =>
      ConversationsApi.list({
        status: filters.status,
        channelId: filters.channelId,
        unreadOnly: filters.unreadOnly ? 'true' : undefined,
        keyword: filters.keyword || undefined,
      }),
    refetchInterval: 15_000,
  });

  if (isLoading) {
    return (
      <ul className="divide-y divide-border">
        {[...Array(6)].map((_, i) => (
          <li key={i} className="p-3">
            <div className="flex gap-2">
              <div className="h-8 w-8 rounded-full bg-bg-muted animate-pulse" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-1/2 rounded bg-bg-muted animate-pulse" />
                <div className="h-2.5 w-3/4 rounded bg-bg-muted animate-pulse" />
              </div>
            </div>
          </li>
        ))}
      </ul>
    );
  }

  const items = data?.items ?? [];
  if (!items.length) {
    return (
      <div className="p-8 text-center">
        <div className="text-sm text-fg-muted">No conversations</div>
        <div className="mt-1 text-xs text-fg-subtle">Try adjusting filters</div>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border overflow-y-auto">
      {items.map((c) => {
        const last = c.messages?.[0];
        const isActive = activeId === c.id;
        return (
          <li
            key={c.id}
            onClick={() => onSelect(c)}
            className={cn(
              'cursor-pointer px-3 py-2.5 transition-colors',
              isActive ? 'bg-brand-500/5 border-l-2 border-l-brand-500 pl-[10px]' : 'hover:bg-bg-muted/50 border-l-2 border-l-transparent',
            )}
          >
            <div className="flex items-start gap-2.5">
              <Avatar
                src={c.contact?.pictureUrl}
                name={c.contact?.displayName}
                size="sm"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className={cn('truncate text-sm', c.unreadCount > 0 ? 'font-semibold text-fg' : 'text-fg')}>
                    {c.contact?.displayName ?? c.contact?.lineUserId ?? 'Unknown'}
                  </span>
                  <span className="shrink-0 text-2xs text-fg-subtle">
                    {c.lastMessageAt
                      ? formatDistanceToNowStrict(new Date(c.lastMessageAt), { addSuffix: false })
                      : ''}
                  </span>
                </div>
                <div className="mt-0.5 flex items-center justify-between gap-2">
                  <span className={cn('truncate text-xs', c.unreadCount > 0 ? 'text-fg-muted' : 'text-fg-subtle')}>
                    {last?.direction === 'outbound' && '↗ '}
                    {last?.textContent ?? (last ? `(${last.messageType})` : '—')}
                  </span>
                  {c.unreadCount > 0 && (
                    <Badge variant="brand" size="sm" className="shrink-0">
                      {c.unreadCount}
                    </Badge>
                  )}
                </div>
                <div className="mt-1.5 flex items-center gap-1 flex-wrap">
                  <Badge variant="outline" size="sm">{c.lineChannel?.name ?? '—'}</Badge>
                  {c.assignedAgent && (
                    <Badge variant="default" size="sm">@{c.assignedAgent.name}</Badge>
                  )}
                  {c.status === 'closed' && <Badge variant="danger" size="sm">closed</Badge>}
                  {c.tags?.slice(0, 2).map((t) => (
                    <Badge key={t.tagId} size="sm" style={{ backgroundColor: `${t.tag.color}20`, color: t.tag.color }}>
                      {t.tag.name}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
