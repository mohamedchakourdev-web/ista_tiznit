'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import type { UserRole } from '@/types';
import { getDashboardPath, getPrimaryRole } from '@/utils/domain';

export function useAuthGuard(allowedRoles?: UserRole[]) {
  const router = useRouter();
  const pathname = usePathname();
  const { initialize, isAuthenticated, isHydrated, status, user } = useAuthStore();
  const allowedRoleKey = allowedRoles?.join('|') ?? '';

  useEffect(() => {
    void initialize();
  }, [initialize]);

  useEffect(() => {
    if (!isHydrated || status === 'loading') return;

    if (!isAuthenticated) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }

    const role = getPrimaryRole(user);
    const allowed = allowedRoleKey ? (allowedRoleKey.split('|') as UserRole[]) : [];
    if (allowed.length && (!role || !allowed.includes(role))) {
      router.replace(getDashboardPath(role));
    }
  }, [allowedRoleKey, isAuthenticated, isHydrated, pathname, router, status, user]);

  return {
    isAuthenticated,
    isHydrated,
    loading: !isHydrated || status === 'loading',
    role: getPrimaryRole(user),
    user,
  };
}
