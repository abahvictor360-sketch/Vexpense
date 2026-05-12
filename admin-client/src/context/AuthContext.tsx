import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { adminApi, ApiError } from '../api';
import type { Admin } from '../types';

interface AuthCtx {
  admin: Admin | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const Ctx = createContext<AuthCtx | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      setLoading(false);
      return;
    }
    adminApi
      .me()
      .then((r) => setAdmin(r.admin))
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          localStorage.removeItem('admin_token');
        }
      })
      .finally(() => setLoading(false));
  }, []);

  async function login(email: string, password: string) {
    const r = await adminApi.login(email, password);
    localStorage.setItem('admin_token', r.token);
    setAdmin(r.admin);
  }

  function logout() {
    localStorage.removeItem('admin_token');
    setAdmin(null);
  }

  return <Ctx.Provider value={{ admin, loading, login, logout }}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
