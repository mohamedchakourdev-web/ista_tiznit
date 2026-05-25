'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { getDashboardPath, getPrimaryRole } from '@/utils/domain';

export default function HomePage() {
  const router = useRouter();
  const { initialize, isHydrated, isAuthenticated, status, user } = useAuthStore();

  useEffect(() => {
    void initialize();
  }, [initialize]);

  useEffect(() => {
    if (!isHydrated || status === 'loading') return;
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }

    router.replace(getDashboardPath(getPrimaryRole(user)));
  }, [isAuthenticated, isHydrated, router, status, user]);

  return (
    <div className="flex h-screen items-center justify-center bg-[#F8FAFC]">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
    </div>
  );
}
