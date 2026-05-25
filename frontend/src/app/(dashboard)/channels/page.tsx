'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Power, Copy, Check } from 'lucide-react';
import { ChannelsApi } from '@/services';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';

export default function ChannelsPage() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ['channels'], queryFn: ChannelsApi.list });
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', channelId: '', channelSecret: '', channelAccessToken: '' });
  const [copied, setCopied] = useState<string | null>(null);

  const create = useMutation({
    mutationFn: ChannelsApi.create,
    onSuccess: () => {
      setForm({ name: '', channelId: '', channelSecret: '', channelAccessToken: '' });
      setShowForm(false);
      qc.invalidateQueries({ queryKey: ['channels'] });
    },
  });

  const toggle = useMutation({
    mutationFn: (c: any) => ChannelsApi.setStatus(c.id, c.status === 'active' ? 'disabled' : 'active'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['channels'] }),
  });

  function copyWebhook(channelId: string) {
    const base = typeof window !== 'undefined' ? window.location.origin.replace(':3000', ':4000') : '';
    navigator.clipboard.writeText(`${base}/webhook/line/${channelId}`);
    setCopied(channelId);
    setTimeout(() => setCopied(null), 1500);
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="flex items-center justify-between border-b border-border bg-bg-elevated px-6 py-4">
        <div>
          <h1 className="text-lg font-semibold text-fg">Channels</h1>
          <p className="text-xs text-fg-subtle">Connect LINE Official Accounts to receive messages</p>
        </div>
        <Button onClick={() => setShowForm((s) => !s)}>
          <Plus className="h-3.5 w-3.5" />
          {showForm ? 'Cancel' : 'Add channel'}
        </Button>
      </div>

      <div className="p-6 space-y-4">
        {showForm && (
          <div className="rounded-lg border border-border bg-bg-elevated p-5">
            <h2 className="mb-3 text-sm font-semibold text-fg">Connect a LINE OA</h2>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Field label="Display name" value={form.name}              onChange={(v) => setForm({ ...form, name: v })} placeholder="e.g. HengShop Main" />
              <Field label="Channel ID (Bot user ID)" value={form.channelId} onChange={(v) => setForm({ ...form, channelId: v })} placeholder="U…" />
              <Field label="Channel secret" value={form.channelSecret}   onChange={(v) => setForm({ ...form, channelSecret: v })} type="password" />
              <Field label="Channel access token" value={form.channelAccessToken} onChange={(v) => setForm({ ...form, channelAccessToken: v })} type="password" />
            </div>
            <div className="mt-4 flex gap-2">
              <Button
                onClick={() => create.mutate(form)}
                disabled={!form.name || !form.channelId || !form.channelSecret || !form.channelAccessToken || create.isPending}
              >
                {create.isPending ? 'Saving…' : 'Create channel'}
              </Button>
              <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </div>
        )}

        <div className="overflow-hidden rounded-lg border border-border bg-bg-elevated">
          <table className="min-w-full text-sm">
            <thead className="border-b border-border bg-bg-subtle">
              <tr className="text-left text-2xs font-medium uppercase tracking-wider text-fg-subtle">
                <th className="px-4 py-2.5">Name</th>
                <th className="px-4 py-2.5">Channel ID</th>
                <th className="px-4 py-2.5">Webhook URL</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data?.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-fg-subtle">
                  No channels connected. Click "Add channel" to get started.
                </td></tr>
              )}
              {data?.map((c) => (
                <tr key={c.id} className="border-t border-border hover:bg-bg-muted/30 transition-colors">
                  <td className="px-4 py-2.5 font-medium text-fg">{c.name}</td>
                  <td className="px-4 py-2.5 font-mono text-2xs text-fg-muted">{c.channelId}</td>
                  <td className="px-4 py-2.5">
                    <button
                      onClick={() => copyWebhook(c.channelId)}
                      className="inline-flex items-center gap-1 font-mono text-2xs text-fg-muted hover:text-fg transition-colors"
                    >
                      /webhook/line/{c.channelId.slice(0, 8)}…
                      {copied === c.channelId
                        ? <Check className="h-3 w-3 text-success" />
                        : <Copy className="h-3 w-3" />}
                    </button>
                  </td>
                  <td className="px-4 py-2.5">
                    <Badge variant={c.status === 'active' ? 'success' : 'danger'}>
                      {c.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <Button size="sm" variant="outline" onClick={() => toggle.mutate(c)}>
                      <Power className="h-3 w-3" />
                      {c.status === 'active' ? 'Disable' : 'Enable'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Field({
  label, value, onChange, placeholder, type = 'text',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-fg-muted">{label}</span>
      <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </label>
  );
}
