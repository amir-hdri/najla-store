import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import { AuthAPI } from '@/lib/api';
import { clearToken, getToken, setToken } from '@/lib/session';
import type { User } from '@/lib/types';
import { useCart } from './CartContext';

interface AuthValue {
  user: User | null;
  token: string | null;
  login(input: { email: string; password: string }): Promise<void>;
  register(input: { name: string; email: string; password: string; phone?: string }): Promise<void>;
  logout(): void;
  refresh(): Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(() => getToken());
  const { refresh: refreshCart } = useCart();
  const merged = useRef(false);

  const afterAuth = useCallback(
    async (newToken: string, newUser: User) => {
      setToken(newToken);
      setTokenState(newToken);
      setUser(newUser);
      try {
        await AuthAPI.mergeCart();
      } catch {
        /* merge is best-effort */
      }
      merged.current = true;
      await refreshCart();
    },
    [refreshCart],
  );

  const login = useCallback(
    async (input: { email: string; password: string }) => {
      const { token: t, user: u } = await AuthAPI.login(input);
      await afterAuth(t, u);
    },
    [afterAuth],
  );

  const register = useCallback(
    async (input: { name: string; email: string; password: string; phone?: string }) => {
      const { token: t, user: u } = await AuthAPI.register(input);
      await afterAuth(t, u);
    },
    [afterAuth],
  );

  const logout = useCallback(() => {
    clearToken();
    setTokenState(null);
    setUser(null);
    merged.current = false;
    void refreshCart();
  }, [refreshCart]);

  const refresh = useCallback(async () => {
    if (!getToken()) {
      setUser(null);
      return;
    }
    try {
      const { user: u } = await AuthAPI.me();
      setUser(u);
    } catch {
      clearToken();
      setTokenState(null);
      setUser(null);
    }
  }, []);

  useEffect(() => {
    if (token) void refresh();
  }, [token, refresh]);

  // Restore guest cart into a logged-in user's server cart once per session.
  useEffect(() => {
    if (!user || merged.current) return;
    merged.current = true;
    AuthAPI.mergeCart()
      .then(() => refreshCart())
      .catch(() => undefined);
  }, [user, refreshCart]);

  const value = useMemo(
    () => ({ user, token, login, register, logout, refresh }),
    [user, token, login, register, logout, refresh],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
