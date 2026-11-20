import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Me } from '@/lib/types';

interface AuthCtx {
  user: Me | null;
  loading: boolean;
  refresh: () => Promise<Me | null>;
  login: (email: string, password: string) => Promise<Me>;
  logout: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const qc = useQueryClient();

  const refresh = useCallback(async () => {
    try {
      const { user } = await api.get<{ user: Me }>('/auth/me');
      setUser(user);
      return user;
    } catch {
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const onUnauth = () => {
      setUser(null);
      qc.clear();
    };
    window.addEventListener('medmap:unauthorized', onUnauth);
    return () => window.removeEventListener('medmap:unauthorized', onUnauth);
  }, [refresh, qc]);

  const login = useCallback(async (email: string, password: string) => {
    await api.post('/auth/login', { email, password });
    qc.clear();
    const me = await refresh();
    if (!me) throw new Error('Login failed');
    return me;
  }, [refresh, qc]);

  const logout = useCallback(async () => {
    await api.post('/auth/logout');
    qc.clear();
    setUser(null);
  }, [qc]);

  return <Ctx.Provider value={{ user, loading, refresh, login, logout }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useAuth outside provider');
  return c;
}
