'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface SessionAgent {
  id: string;
  workspaceId: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'supervisor' | 'agent';
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  agent: SessionAgent | null;
  setSession: (s: { accessToken: string; refreshToken: string; agent: SessionAgent }) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      agent: null,
      setSession: (s) =>
        set({ accessToken: s.accessToken, refreshToken: s.refreshToken, agent: s.agent }),
      clear: () => set({ accessToken: null, refreshToken: null, agent: null }),
    }),
    { name: 'hengchat-auth' },
  ),
);
