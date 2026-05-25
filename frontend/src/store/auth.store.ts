'use client';

import { create } from 'zustand';
import { authService } from '@/services/api/auth.service';
import type { User, UserRole } from '@/types';
import { getPrimaryRole } from '@/utils/domain';

const TOKEN_KEY = 'ofppt_token';
const USER_KEY = 'ofppt_user';
let initializePromise: Promise<void> | null = null;

type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated';

interface AuthState {
  user: User | null;
  token: string | null;
  status: AuthStatus;
  isAuthenticated: boolean;
  isHydrated: boolean;
  setAuth: (user: User, token: string) => void;
  setUser: (user: User) => void;
  initialize: () => Promise<void>;
  clearAuth: () => void;
  hasRole: (role: UserRole) => boolean;
  hasAnyRole: (...roles: UserRole[]) => boolean;
}

function writeSessionCookies(user: User | null, authenticated: boolean): void {
  if (typeof document === 'undefined') return;

  if (!authenticated || !user) {
    document.cookie = 'ofppt_auth=; Path=/; Max-Age=0; SameSite=Lax';
    document.cookie = 'ofppt_role=; Path=/; Max-Age=0; SameSite=Lax';
    return;
  }

  const role = getPrimaryRole(user);
  document.cookie = 'ofppt_auth=1; Path=/; Max-Age=604800; SameSite=Lax';
  document.cookie = `ofppt_role=${role ?? ''}; Path=/; Max-Age=604800; SameSite=Lax`;
}

function persistSession(user: User, token: string): void {
  window.localStorage.setItem(TOKEN_KEY, token);
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
  writeSessionCookies(user, true);
}

function clearSession(): void {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(USER_KEY);
  }

  writeSessionCookies(null, false);
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  status: 'idle',
  isAuthenticated: false,
  isHydrated: false,

  setAuth: (user, token) => {
    persistSession(user, token);
    set({ user, token, status: 'authenticated', isAuthenticated: true, isHydrated: true });
  },

  setUser: (user) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
    writeSessionCookies(user, true);
    set({ user, status: 'authenticated', isAuthenticated: true, isHydrated: true });
  },

  initialize: async () => {
    if (typeof window === 'undefined') return;

    if (initializePromise) return initializePromise;

    initializePromise = (async () => {
      const token = window.localStorage.getItem(TOKEN_KEY);
      const userJson = window.localStorage.getItem(USER_KEY);

      if (!token) {
        clearSession();
        set({ user: null, token: null, status: 'unauthenticated', isAuthenticated: false, isHydrated: true });
        return;
      }

      let cachedUser: User | null = null;

      if (userJson) {
        try {
          cachedUser = JSON.parse(userJson) as User;
        } catch {
          cachedUser = null;
        }
      }

      set({
        user: cachedUser,
        token,
        status: cachedUser ? 'authenticated' : 'loading',
        isAuthenticated: Boolean(cachedUser),
        isHydrated: true,
      });

      try {
        const response = await authService.me();
        persistSession(response.data, token);
        set({ user: response.data, token, status: 'authenticated', isAuthenticated: true, isHydrated: true });
      } catch {
        clearSession();
        set({ user: null, token: null, status: 'unauthenticated', isAuthenticated: false, isHydrated: true });
      }
    })();

    try {
      await initializePromise;
    } finally {
      initializePromise = null;
    }
  },

  clearAuth: () => {
    clearSession();
    set({ user: null, token: null, status: 'unauthenticated', isAuthenticated: false, isHydrated: true });
  },

  hasRole: (role) => get().user?.roles?.includes(role) ?? false,

  hasAnyRole: (...roles) => {
    const userRoles = get().user?.roles ?? [];
    return roles.some((role) => userRoles.includes(role));
  },
}));

export { TOKEN_KEY, USER_KEY };
