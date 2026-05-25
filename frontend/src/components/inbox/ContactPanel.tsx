'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { ChevronDown, MessageSquareLock, User, Tag as TagIcon, StickyNote, X } from 'lucide-react';
import { AgentsApi, ConversationsApi, NotesApi, TagsApi } from '@/services';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Select, Textarea } from '@/components/ui/Input';
import { cn } from '@/lib/cn';
import type { Conversation } from '@/types';

function Section({
  title,
  icon: Icon,
  children,
  defaultOpen = true,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="border-b border-border">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-4 py-2.5 text-left hover:bg-bg-muted/40 transition-colors"
      >
        <span className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-fg-subtle">
          <Icon className="h-3.5 w-3.5" />
          {title}
        </span>
        <ChevronDown className={cn('h-3.5 w-3.5 text-fg-subtle transition-transform', !open && '-rotate-90')} />
      </button>
      {open && <div className="px-4 pb-3">{children}</div>}
    </section>
  );
}

export function ContactPanel({ conversation }: { conversation: Conversation }) {
  const qc = useQueryClient();
  const [noteText, setNoteText] = useState('');

  const agents = useQuery({ queryKey: ['agents'], queryFn: AgentsApi.list });
  const tags = useQuery({ queryKey: ['tags'], queryFn: TagsApi.list });
  const notes = useQuery({
    queryKey: ['notes', conversation.id],
    queryFn: () => NotesApi.list(conversation.id),
  });

  async function assign(agentId: string) {
    await ConversationsApi.assign(conversation.id, agentId || null);
    qc.invalidateQueries({ queryKey: ['conversations'] });
    qc.invalidateQueries({ queryKey: ['conversation', conversation.id] });
  }
  async function addTag(tagId: string) {
    if (!tagId) return;
    await ConversationsApi.addTag(conversation.id, tagId);
    qc.invalidateQueries({ queryKey: ['conversations'] });
    qc.invalidateQueries({ queryKey: ['conversation', conversation.id] });
  }
  async function removeTag(tagId: string) {
    await ConversationsApi.removeTag(conversation.id, tagId);
    qc.invalidateQueries({ queryKey: ['conversations'] });
    qc.invalidateQueries({ queryKey: ['conversation', conversation.id] });
  }
  async function addNote() {
    if (!noteText.trim()) return;
    await NotesApi.create(conversation.id, noteText.trim());
    setNoteText('');
    qc.invalidateQueries({ queryKey: ['notes', conversation.id] });
  }
  async function close() {
    await ConversationsApi.close(conversation.id);
    qc.invalidateQueries({ queryKey: ['conversations'] });
    qc.invalidateQueries({ queryKey: ['conversation', conversation.id] });
  }
  async function reopen() {
    await ConversationsApi.reopen(conversation.id);
    qc.invalidateQueries({ queryKey: ['conversations'] });
    qc.invalidateQueries({ queryKey: ['conversation', conversation.id] });
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-bg-subtle">
      {/* Contact header */}
      <div className="border-b border-border bg-bg-elevated p-4">
        <div className="flex items-center gap-3">
          <Avatar
            src={conversation.contact?.pictureUrl}
            name={conversation.contact?.displayName}
            size="lg"
          />
          <div className="min-w-0">
            <div className="truncate text-base font-semibold text-fg">
              {conversation.contact?.displayName ?? 'Unknown'}
            </div>
            <div className="truncate text-xs text-fg-subtle font-mono">
              {conversation.contact?.lineUserId}
            </div>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs">
          <span className="text-fg-subtle">Channel</span>
          <span className="font-medium text-fg">{conversation.lineChannel?.name}</span>
        </div>
      </div>

      <Section title="Assignment" icon={User}>
        <Select value={conversation.assignedAgentId ?? ''} onChange={(e) => assign(e.target.value)}>
          <option value="">Unassigned</option>
          {agents.data?.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </Select>
      </Section>

      <Section title="Tags" icon={TagIcon}>
        <div className="flex flex-wrap gap-1.5">
          {conversation.tags?.length === 0 && (
            <span className="text-xs text-fg-subtle">No tags</span>
          )}
          {conversation.tags?.map((t) => (
            <span
              key={t.tagId}
              className="inline-flex items-center gap-1 rounded h-5 px-1.5 text-2xs"
              style={{ backgroundColor: `${t.tag.color}20`, color: t.tag.color }}
            >
              {t.tag.name}
              <button onClick={() => removeTag(t.tagId)} className="hover:opacity-70">
                <X className="h-2.5 w-2.5" />
              </button>
            </span>
          ))}
        </div>
        <Select
          onChange={(e) => { addTag(e.target.value); e.target.value = ''; }}
          className="mt-2"
          defaultValue=""
        >
          <option value="">+ Add tag…</option>
          {tags.data?.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </Select>
      </Section>

      <Section title="Internal notes" icon={StickyNote}>
        <div className="space-y-2">
          {notes.data?.length === 0 && (
            <p className="text-xs text-fg-subtle">No notes yet</p>
          )}
          {notes.data?.map((n) => (
            <div key={n.id} className="rounded-md border border-warning/30 bg-warning/5 p-2">
              <div className="text-xs text-fg">{n.noteText}</div>
              <div className="mt-1 text-2xs text-fg-subtle">
                {n.agent?.name} · {new Date(n.createdAt).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
        <Textarea
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          rows={2}
          placeholder="Add an internal note…"
          className="mt-2 text-xs"
        />
        <Button variant="outline" size="sm" className="mt-2 w-full" onClick={addNote}>
          Save note
        </Button>
      </Section>

      {/* Actions */}
      <div className="mt-auto border-t border-border bg-bg-elevated p-4">
        {conversation.status === 'closed' ? (
          <Button variant="primary" className="w-full" onClick={reopen}>
            Reopen conversation
          </Button>
        ) : (
          <Button variant="outline" className="w-full" onClick={close}>
            <MessageSquareLock className="h-3.5 w-3.5" />
            Close conversation
          </Button>
        )}
      </div>
    </div>
  );
}
