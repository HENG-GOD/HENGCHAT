'use client';

import { useQuery } from '@tanstack/react-query';
import {
  MessageCircle, MessageCircleX, MailWarning, ArrowDown, ArrowUp, Users2,
} from 'lucide-react';
import { ReportsApi } from '@/services';
import { cn } from '@/lib/cn';

interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: 'up' | 'down' | null;
  accent?: 'brand' | 'warning' | 'danger' | 'info';
}

function StatCard({ label, value, icon: Icon, accent = 'brand' }: StatCardProps) {
  const accentClasses = {
    brand:   'text-brand-500 bg-brand-500/10',
    warning: 'text-warning bg-warning/10',
    danger:  'text-danger bg-danger/10',
    info:    'text-info bg-info/10',
  }[accent];

  return (
    <div className="rounded-lg border border-border bg-bg-elevated p-4">
      <div className="flex items-start justify-between">
        <div className="text-xs font-medium text-fg-muted">{label}</div>
        <div className={cn('flex h-7 w-7 items-center justify-center rounded-md', accentClasses)}>
          <Icon className="h-3.5 w-3.5" />
        </div>
      </div>
      <div className="mt-2 text-2xl font-semibold tracking-tight text-fg tabular-nums">{value}</div>
    </div>
  );
}

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['report-summary'],
    queryFn: ReportsApi.summary,
  });

  return (
    <div className="h-full overflow-y-auto">
      <div className="border-b border-border bg-bg-elevated px-6 py-4">
        <h1 className="text-lg font-semibold text-fg">Overview</h1>
        <p className="text-xs text-fg-subtle">Realtime workspace summary</p>
      </div>

      <div className="p-6">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-24 rounded-lg border border-border bg-bg-muted animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            <StatCard label="Open"    value={data?.openConversations ?? 0}    icon={MessageCircle}  accent="brand" />
            <StatCard label="Closed"  value={data?.closedConversations ?? 0}  icon={MessageCircleX} accent="info" />
            <StatCard label="Unread"  value={data?.unreadConversations ?? 0}  icon={MailWarning}    accent="warning" />
            <StatCard label="Inbound" value={data?.inboundMessages ?? 0}      icon={ArrowDown}      accent="info" />
            <StatCard label="Outbound" value={data?.outboundMessages ?? 0}    icon={ArrowUp}        accent="brand" />
            <StatCard label="Online agents" value={data?.onlineAgents ?? 0}   icon={Users2}         accent="brand" />
          </div>
        )}
      </div>
    </div>
  );
}
