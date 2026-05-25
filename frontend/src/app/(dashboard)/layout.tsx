'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import {
  LayoutDashboard, Inbox, Plug, Users, Tag, BarChart3, LogOut, Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { useAuthStore } from '@/lib/auth-store';
import { AuthApi } from '@/services';
import { disconnectSocket, getSocket } from '@/lib/socket';
import { Avatar } from '@/components/ui/Avatar';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

const nav = [
  { href: '/',         label: 'Dashboard', icon: LayoutDashboard },
  { href: '/inbox',    label: 'Inbox',     icon: Inbox },
  { href: '/channels', label: 'Channels',  icon: Plug },
  { href: '/agents',   label: 'Agents',    icon: Users },
  { href: '/tags',     label: 'Tags',      icon: Tag },
  { href: '/reports',  label: 'Reports',   icon: BarChart3 },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const agent = useAuthStore((s) => s.agent);
  const clear = useAuthStore((s) => s.clear);

  useEffect(() => {
    if (!useAuthStore.getState().accessToken) {
      router.replace('/login');
      return;
    }
    const s = getSocket();
    return () => { s.off(); };
  }, [router]);

  async function logout() {
    try { await AuthApi.logout(); } catch {}
    disconnectSocket();
    clear();
    router.replace('/login');
  }

  return (
    <div className="flex h-screen bg-bg">
      {/* Sidebar — Linear-style: compact, icon + label, subtle active indicator */}
      <aside className="flex w-56 shrink-0 flex-col border-r border-border bg-bg-subtle">
        {/* Brand */}
        <div className="flex h-12 items-center gap-2 px-4 border-b border-border">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-brand-500 text-brand-fg">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <span className="text-sm font-semibold tracking-tight">HENGCHAT</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-2">
          <div className="mb-1 px-2 py-1.5 text-2xs font-medium uppercase tracking-wider text-fg-subtle">
            Workspace
          </div>
          {nav.map((n) => {
            const Icon = n.icon;
            const active = pathname === n.href || (n.href !== '/' && pathname.startsWith(n.href));
            return (
              <Link
                key={n.href}
                href={n.href}
                className={cn(
                  'group flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors mb-0.5',
                  active
                    ? 'bg-bg-muted text-fg font-medium'
                    : 'text-fg-muted hover:bg-bg-muted/60 hover:text-fg',
                )}
              >
                <Icon className={cn('h-4 w-4', active ? 'text-brand-500' : 'text-fg-subtle group-hover:text-fg-muted')} />
                <span>{n.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User block */}
        <div className="border-t border-border p-2">
          <div className="flex items-center gap-2 rounded-md p-2">
            <Avatar name={agent?.name} size="sm" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-fg">{agent?.name}</div>
              <div className="truncate text-2xs text-fg-subtle">{agent?.email}</div>
            </div>
            <button
              onClick={logout}
              title="Sign out"
              className="flex h-7 w-7 items-center justify-center rounded text-fg-subtle hover:bg-bg-muted hover:text-danger transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="mt-1 flex items-center justify-between px-2">
            <span className="text-2xs text-fg-subtle">Theme</span>
            <ThemeToggle />
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
