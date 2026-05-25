'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import { TagsApi } from '@/services';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

const PRESET_COLORS = ['#06c755', '#3b82f6', '#a855f7', '#ec4899', '#f59e0b', '#ef4444', '#64748b'];

export default function TagsPage() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ['tags'], queryFn: TagsApi.list });
  const [name, setName] = useState('');
  const [color, setColor] = useState('#06c755');

  const create = useMutation({
    mutationFn: () => TagsApi.create({ name, color }),
    onSuccess: () => { setName(''); qc.invalidateQueries({ queryKey: ['tags'] }); },
  });
  const remove = useMutation({
    mutationFn: TagsApi.remove,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tags'] }),
  });

  return (
    <div className="h-full overflow-y-auto">
      <div className="border-b border-border bg-bg-elevated px-6 py-4">
        <h1 className="text-lg font-semibold text-fg">Tags</h1>
        <p className="text-xs text-fg-subtle">Organize conversations with colored labels</p>
      </div>

      <div className="p-6 space-y-4 max-w-2xl">
        <div className="rounded-lg border border-border bg-bg-elevated p-4">
          <div className="flex gap-2">
            <Input
              placeholder="Tag name…"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && name && create.mutate()}
            />
            <Button onClick={() => create.mutate()} disabled={!name || create.isPending}>
              <Plus className="h-3.5 w-3.5" />
              Add
            </Button>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className="text-2xs text-fg-subtle">Color:</span>
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`h-5 w-5 rounded-full border-2 transition-transform ${color === c ? 'border-fg scale-110' : 'border-border'}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-border bg-bg-elevated overflow-hidden">
          {data?.length === 0 && (
            <div className="px-4 py-10 text-center text-sm text-fg-subtle">No tags yet</div>
          )}
          <ul className="divide-y divide-border">
            {data?.map((t) => (
              <li key={t.id} className="flex items-center justify-between px-4 py-2.5 hover:bg-bg-muted/30 transition-colors">
                <span className="inline-flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: t.color }} />
                  <span className="text-sm text-fg">{t.name}</span>
                </span>
                <Button size="icon" variant="ghost" onClick={() => remove.mutate(t.id)} title="Delete">
                  <Trash2 className="h-3.5 w-3.5 text-danger" />
                </Button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
