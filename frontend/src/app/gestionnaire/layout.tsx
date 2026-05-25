'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useAuthGuard } from '@/hooks/use-auth-guard';

export default function GestionnaireLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuthGuard(['gestionnaire', 'directeur']);

  if (!isAuthenticated || loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F8FAFC]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
      </div>
    );
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}
