'use client';

import { io, Socket } from 'socket.io-client';
import { useAuthStore } from './auth-store';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (socket) return socket;
  const token = useAuthStore.getState().accessToken;
  socket = io(process.env.NEXT_PUBLIC_WS_URL ?? '/', {
    transports: ['websocket'],
    auth: { token },
    path: '/socket.io',
  });
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
