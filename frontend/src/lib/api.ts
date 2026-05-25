import axios, { AxiosError } from 'axios';
import { useAuthStore } from './auth-store';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL ?? '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((cfg) => {
  const t = useAuthStore.getState().accessToken;
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

api.interceptors.response.use(
  (res) => {
    if (res.data && typeof res.data === 'object' && 'success' in res.data) {
      return { ...res, data: (res.data as any).data };
    }
    return res;
  },
  (err: AxiosError) => {
    if (err.response?.status === 401) {
      useAuthStore.getState().clear();
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  },
);
