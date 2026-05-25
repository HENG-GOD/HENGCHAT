'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Moon, Sun, Monitor } from 'lucide-react';
import { cn } from '@/lib/cn';

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className={cn('h-7 w-20', className)} />;

  const items: Array<{ value: 'light' | 'dark' | 'system'; icon: React.ReactNode; label: string }> = [
    { value: 'light',  icon: <Sun  className="h-3.5 w-3.5" />, label: 'Light' },
    { value: 'system', icon: <Monitor className="h-3.5 w-3.5" />, label: 'System' },
    { value: 'dark',   icon: <Moon className="h-3.5 w-3.5" />, label: 'Dark' },
  ];

  return (
    <div
      className={cn(
        'inline-flex items-center gap-0.5 rounded-md border border-border bg-bg-elevated p-0.5',
        className,
      )}
    >
      {items.map((it) => (
        <button
          key={it.value}
          type="button"
          aria-label={it.label}
          onClick={() => setTheme(it.value)}
          className={cn(
            'flex h-6 w-6 items-center justify-center rounded transition-colors',
            theme === it.value
              ? 'bg-bg-muted text-fg'
              : 'text-fg-subtle hover:text-fg hover:bg-bg-muted/60',
          )}
        >
          {it.icon}
        </button>
      ))}
    </div>
  );
}
