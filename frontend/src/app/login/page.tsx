'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { AuthApi } from '@/services';
import { useAuthStore } from '@/lib/auth-store';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function LoginPage() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = await AuthApi.login(email, password);
      setSession(data);
      router.replace('/inbox');
    } catch (err: any) {
      setError(err?.response?.data?.error?.message ?? 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4 relative overflow-hidden">
      {/* Subtle gradient glow */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full bg-brand-500/10 blur-3xl" />
      </div>

      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm rounded-lg border border-border bg-bg-elevated p-8 shadow-md"
      >
        {/* Brand */}
        <div className="mb-6 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-brand-500 text-brand-fg">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <div className="text-base font-semibold tracking-tight">HENGCHAT</div>
            <div className="text-2xs text-fg-subtle">Shared LINE inbox</div>
          </div>
        </div>

        <h1 className="text-lg font-semibold text-fg">Welcome back</h1>
        <p className="mb-5 text-xs text-fg-subtle">Sign in to your workspace</p>

        <label className="mb-3 block">
          <span className="mb-1 block text-xs font-medium text-fg-muted">Email</span>
          <Input
            type="email"
            required
            autoFocus
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="mb-4 block">
          <span className="mb-1 block text-xs font-medium text-fg-muted">Password</span>
          <Input
            type="password"
            required
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        {error && (
          <div className="mb-3 rounded-md border border-danger/30 bg-danger/5 px-3 py-2 text-xs text-danger">
            {error}
          </div>
        )}

        <Button type="submit" size="lg" disabled={loading} className="w-full">
          {loading ? 'Signing in…' : 'Sign in'}
        </Button>

        <p className="mt-4 text-center text-2xs text-fg-subtle">
          Multi-OA LINE chat management
        </p>
      </form>
    </div>
  );
}
