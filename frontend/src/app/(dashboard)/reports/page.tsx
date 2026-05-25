'use client';

import { useQuery } from '@tanstack/react-query';
import { ReportsApi } from '@/services';
import { Avatar } from '@/components/ui/Avatar';

const STAT_LABELS: Record<string, string> = {
  openConversations:   'Open',
  closedConversations: 'Closed',
  unreadConversations: 'Unread',
  inboundMessages:     'Inbound msgs',
  outboundMessages:    'Outbound msgs',
  onlineAgents:        'Online agents',
};

export default function ReportsPage() {
  const summary = useQuery({ queryKey: ['report-summary'], queryFn: ReportsApi.summary });
  const agents = useQuery({ queryKey: ['report-agents'], queryFn: ReportsApi.agents });
  const channels = useQuery({ queryKey: ['report-channels'], queryFn: ReportsApi.channels });

  const maxAgent = Math.max(1, ...(agents.data?.map((a: any) => a.outboundCount) ?? [0]));
  const maxChannel = Math.max(1, ...(channels.data?.map((c: any) => c.count) ?? [0]));

  return (
    <div className="h-full overflow-y-auto">
      <div className="border-b border-border bg-bg-elevated px-6 py-4">
        <h1 className="text-lg font-semibold text-fg">Reports</h1>
        <p className="text-xs text-fg-subtle">Overview of activity across your workspace</p>
      </div>

      <div className="p-6 space-y-5">
        <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          {summary.data &&
            Object.entries(summary.data).map(([k, v]) => (
              <div key={k} className="rounded-lg border border-border bg-bg-elevated p-4">
                <div className="text-2xs uppercase tracking-wider text-fg-subtle">{STAT_LABELS[k] ?? k}</div>
                <div className="mt-1.5 text-xl font-semibold tabular-nums text-fg">{String(v)}</div>
              </div>
            ))}
        </section>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-lg border border-border bg-bg-elevated overflow-hidden">
            <div className="border-b border-border px-4 py-2.5">
              <h2 className="text-sm font-semibold text-fg">Outbound by agent</h2>
            </div>
            <div className="p-4 space-y-2.5">
              {agents.data?.length === 0 && <p className="text-xs text-fg-subtle">No data yet</p>}
              {agents.data?.map((r: any, i: number) => {
                const pct = (r.outboundCount / maxAgent) * 100;
                return (
                  <div key={i}>
                    <div className="mb-1 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Avatar name={r.agent?.name} size="xs" />
                        <span className="text-xs text-fg">{r.agent?.name ?? 'Unknown'}</span>
                      </div>
                      <span className="text-xs font-medium tabular-nums text-fg">{r.outboundCount}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-brand-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-bg-elevated overflow-hidden">
            <div className="border-b border-border px-4 py-2.5">
              <h2 className="text-sm font-semibold text-fg">Conversations by channel</h2>
            </div>
            <div className="p-4 space-y-2.5">
              {channels.data?.length === 0 && <p className="text-xs text-fg-subtle">No data yet</p>}
              {channels.data?.map((r: any, i: number) => {
                const pct = (r.count / maxChannel) * 100;
                return (
                  <div key={i}>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-xs text-fg">
                        {r.channelName} <span className="text-fg-subtle">· {r.status}</span>
                      </span>
                      <span className="text-xs font-medium tabular-nums text-fg">{r.count}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-info" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
