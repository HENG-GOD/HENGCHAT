'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Circle } from 'lucide-react';
import { AgentsApi } from '@/services';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/cn';

const ROLE_LABEL: Record<string, string> = {
  owner: 'Owner', admin: 'Admin', supervisor: 'Supervisor', agent: 'Agent',
};

export default function AgentsPage() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ['agents'], queryFn: AgentsApi.list });
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'agent' });

  const create = useMutation({
    mutationFn: () => AgentsApi.create(form),
    onSuccess: () => {
      setForm({ name: '', email: '', password: '', role: 'agent' });
      setShowForm(false);
      qc.invalidateQueries({ queryKey: ['agents'] });
    },
  });

  return (
    <div className="h-full overflow-y-auto">
      <div className="flex items-center justify-between border-b border-border bg-bg-elevated px-6 py-4">
        <div>
          <h1 className="text-lg font-semibold text-fg">Agents</h1>
          <p className="text-xs text-fg-subtle">Manage team members and their roles</p>
        </div>
        <Button onClick={() => setShowForm((s) => !s)}>
          <Plus className="h-3.5 w-3.5" />
          {showForm ? 'Cancel' : 'Invite agent'}
        </Button>
      </div>

      <div className="p-6 space-y-4">
        {showForm && (
          <div className="rounded-lg border border-border bg-bg-elevated p-5">
            <h2 className="mb-3 text-sm font-semibold text-fg">New agent</h2>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-fg-muted">Name</span>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-fg-muted">Email</span>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-fg-muted">Temporary password</span>
                <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-fg-muted">Role</span>
                <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                  <option value="agent">Agent</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="admin">Admin</option>
                </Select>
              </label>
            </div>
            <Button className="mt-4" onClick={() => create.mutate()} disabled={create.isPending}>
              {create.isPending ? 'Inviting…' : 'Send invite'}
            </Button>
          </div>
        )}

        <div className="overflow-hidden rounded-lg border border-border bg-bg-elevated">
          <table className="min-w-full text-sm">
            <thead className="border-b border-border bg-bg-subtle">
              <tr className="text-left text-2xs font-medium uppercase tracking-wider text-fg-subtle">
                <th className="px-4 py-2.5">Agent</th>
                <th className="px-4 py-2.5">Email</th>
                <th className="px-4 py-2.5">Role</th>
                <th className="px-4 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody>
              {data?.map((a) => (
                <tr key={a.id} className="border-t border-border hover:bg-bg-muted/30 transition-colors">
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={a.name} size="sm" />
                      <span className="font-medium text-fg">{a.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-fg-muted">{a.email}</td>
                  <td className="px-4 py-2.5">
                    <Badge variant="info">{ROLE_LABEL[a.role] ?? a.role}</Badge>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="inline-flex items-center gap-1.5 text-xs">
                      <Circle className={cn('h-2 w-2', a.isOnline ? 'fill-success text-success' : 'fill-fg-subtle text-fg-subtle')} />
                      <span className={a.isOnline ? 'text-fg' : 'text-fg-subtle'}>
                        {a.isOnline ? 'Online' : 'Offline'}
                      </span>
                    </span>
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
