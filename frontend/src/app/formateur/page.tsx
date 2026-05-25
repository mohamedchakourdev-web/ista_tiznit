'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Activity, ArrowUpRight, BookOpen, ChevronRight, FileCheck, Users } from 'lucide-react';
import { autorisationService, formateurService } from '@/services/api';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { AutorisationStatusBadge, ReadStatusBadge } from '@/components/shared/status-badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { getStagiaireFullName } from '@/utils/domain';

export default function FormateurDashboard() {
  const { data: groupes, isLoading: groupesLoading } = useQuery({
    queryKey: ['formateur', 'groupes'],
    queryFn: () => formateurService.groupes({ per_page: 10 }),
  });

  const { data: autorisations, isLoading: autorisationsLoading } = useQuery({
    queryKey: ['formateur', 'autorisations'],
    queryFn: () => autorisationService.formateurList({ per_page: 10 }),
  });

  const unread = autorisations?.data.filter((autorisation) => !autorisation.is_read).length ?? 0;
  const total = autorisations?.data.length ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader title="Mon espace" description="Vos groupes et autorisations" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/formateur/groupes">
          <div className="group rounded-xl border border-border/50 bg-card p-5 transition-all hover:border-border/70 hover:shadow-[0_1px_4px_rgba(0,0,0,0.03)]">
            <div className="mb-5 flex items-center justify-between">
              <span className="text-[13px] font-medium text-muted-foreground">Mes groupes</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted/50 text-muted-foreground transition-colors group-hover:bg-blue-50 group-hover:text-blue-600">
                <BookOpen className="h-4 w-4" />
              </div>
            </div>
            {groupesLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-[28px] font-semibold leading-none tracking-tight">{groupes?.data.length ?? 0}</p>}
            <p className="mt-1.5 text-[13px] text-muted-foreground">Groupes assignes</p>
          </div>
        </Link>
        <Link href="/formateur/autorisations">
          <div className="group rounded-xl border border-border/50 bg-card p-5 transition-all hover:border-border/70 hover:shadow-[0_1px_4px_rgba(0,0,0,0.03)]">
            <div className="mb-5 flex items-center justify-between">
              <span className="text-[13px] font-medium text-muted-foreground">Non lues</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted/50 text-muted-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
                <FileCheck className="h-4 w-4" />
              </div>
            </div>
            {autorisationsLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-[28px] font-semibold leading-none tracking-tight">{unread}</p>}
            <p className="mt-1.5 text-[13px] text-muted-foreground">Autorisations a consulter</p>
          </div>
        </Link>
        <div className="rounded-xl border border-border/50 bg-card p-5">
          <div className="mb-5 flex items-center justify-between">
            <span className="text-[13px] font-medium text-muted-foreground">Total autorisations</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted/50 text-muted-foreground">
              <FileCheck className="h-4 w-4" />
            </div>
          </div>
          {autorisationsLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-[28px] font-semibold leading-none tracking-tight">{total}</p>}
          <p className="mt-1.5 text-[13px] text-muted-foreground">Recues au total</p>
        </div>
        <div className="rounded-xl border border-border/50 bg-card p-5">
          <div className="mb-5 flex items-center justify-between">
            <span className="text-[13px] font-medium text-muted-foreground">Taux de lecture</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted/50 text-muted-foreground">
              <Activity className="h-4 w-4" />
            </div>
          </div>
          {autorisationsLoading ? (
            <Skeleton className="h-8 w-12" />
          ) : (
            <p className="text-[28px] font-semibold leading-none tracking-tight">{total > 0 ? Math.round(((total - unread) / total) * 100) : 0}%</p>
          )}
          <p className="mt-1.5 text-[13px] text-muted-foreground">Autorisations lues</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-[14px] font-semibold text-foreground">Mes groupes assignes</h2>
              <p className="mt-0.5 text-[13px] text-muted-foreground">Cliquez pour voir les stagiaires</p>
            </div>
          </div>
          {groupesLoading ? (
            <div className="space-y-3">{[1, 2].map((item) => <Skeleton key={item} className="h-[80px] rounded-xl" />)}</div>
          ) : !groupes?.data.length ? (
            <EmptyState title="Aucun groupe" description="Vous n'avez pas encore de groupes assignes." icon={BookOpen} />
          ) : (
            <div className="space-y-3">
              {groupes.data.map((groupe) => (
                <Link key={groupe.id} href={`/formateur/groupes?groupe=${groupe.id}`}>
                  <div className="group flex items-center justify-between rounded-xl border border-border/50 bg-card px-5 py-4 transition-all hover:border-border/70 hover:bg-muted/30">
                    <div>
                      <p className="text-[14px] font-semibold text-foreground">{groupe.nom}</p>
                      <p className="mt-1 text-[12px] text-muted-foreground">{groupe.filiere?.nom}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant="outline" className="gap-2 rounded-lg border-border/50 bg-muted/50 px-2.5 py-1 text-[12px] text-muted-foreground">
                        <Users className="h-4 w-4" />
                        {groupe.stagiaires_count ?? 0}
                      </Badge>
                      <ChevronRight className="h-4 w-4 text-muted-foreground/60 transition-colors group-hover:text-muted-foreground" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-[14px] font-semibold text-foreground">Autorisations recentes</h2>
              <p className="mt-0.5 text-[13px] text-muted-foreground">Dernieres demandes recues</p>
            </div>
            <Link href="/formateur/autorisations" className="flex h-9 items-center gap-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground">
              Voir tout
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {autorisationsLoading ? (
            <div className="space-y-3">{[1, 2, 3].map((item) => <Skeleton key={item} className="h-[96px] rounded-xl" />)}</div>
          ) : !autorisations?.data.length ? (
            <EmptyState title="Aucune autorisation" icon={FileCheck} className="py-12" />
          ) : (
            <div className="space-y-3">
              {autorisations.data.slice(0, 5).map((autorisation) => (
                <div key={autorisation.id} className={`rounded-xl border px-5 py-4 transition-all ${autorisation.is_read ? 'border-border/50 bg-card' : 'border-primary/30 bg-primary/[0.02] shadow-sm'}`}>
                  <div className="mb-2.5 flex items-center justify-between">
                    <p className="truncate pr-2 text-[14px] font-semibold text-foreground">{getStagiaireFullName(autorisation.absence?.stagiaire)}</p>
                    <AutorisationStatusBadge statut={autorisation.statut} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="rounded-md border border-border/30 bg-muted/40 px-2.5 py-1 text-[13px] tabular-nums text-muted-foreground">
                      {autorisation.absence?.date_absence ?? '-'}
                    </span>
                    <ReadStatusBadge isRead={autorisation.is_read} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
