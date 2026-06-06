'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, BookOpen, FileCheck, FolderOpen, GraduationCap, Users } from 'lucide-react';
import { directorService } from '@/services/api';
import { PageHeader } from '@/components/shared/page-header';
import { StatsSkeleton, TableSkeleton } from '@/components/shared/loading-skeleton';
import { AbsenceTypeBadge, PeriodBadge } from '@/components/shared/status-badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { compactDate, getStagiaireFullName } from '@/utils/domain';

export default function DirecteurDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['director-overview'],
    queryFn: () => directorService.overview(),
  });

  const overview = data?.data;
  const stats = overview?.statistics;

  const cards = stats
    ? [
        { label: 'Utilisateurs', value: stats.users_count, icon: Users, desc: `${stats.active_users_count} actifs`, href: '/directeur/users' },
        { label: 'Filières', value: stats.filieres_count, icon: FolderOpen, desc: 'Filières enregistrées', href: '/gestionnaire/filieres' },
        { label: 'Groupes', value: stats.groupes_count, icon: BookOpen, desc: 'Groupes de formation', href: '/gestionnaire/groupes' },
        { label: 'Stagiaires', value: stats.stagiaires_count, icon: GraduationCap, desc: 'Inscrits', href: '/gestionnaire/stagiaires' },
        { label: 'Absences', value: stats.absences_count, icon: AlertTriangle, desc: 'Historique complet', href: '/gestionnaire/absences' },
        { label: 'Autorisations', value: stats.autorisations_en_attente_count, icon: FileCheck, desc: 'En attente', href: '/gestionnaire/autorisations' },
      ]
    : [];

  return (
    <div className="space-y-6">
      <PageHeader title="Tableau de bord directeur" description="Vue globale des absences, groupes et utilisateurs" />

      {isLoading ? (
        <StatsSkeleton count={6} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {cards.map((card) => (
            <Link key={card.label} href={card.href} className="flex flex-col h-full">
              <div className="h-full rounded-xl border border-border/50 bg-card p-5 hover:border-border/70 hover:shadow-[0_1px_4px_rgba(0,0,0,0.03)] transition-all group cursor-pointer flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <span className="text-[13px] font-medium text-muted-foreground">{card.label}</span>
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted/50 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                      <card.icon className="h-4 w-4" />
                    </div>
                  </div>
                  <p className="text-[28px] font-semibold tracking-tight leading-none">{card.value}</p>
                </div>
                <p className="text-[13px] text-muted-foreground mt-1.5">{card.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {isLoading ? (
        <TableSkeleton columns={5} rows={5} />
      ) : (
        <div className="rounded-xl border border-border/50 bg-card shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border/50">
            <h2 className="text-[14px] font-semibold text-foreground">Dernières absences</h2>
            <p className="text-[13px] text-muted-foreground mt-0.5">Les absences les plus récentes enregistrées</p>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b border-border/50">
                <TableHead className="text-[11px] font-medium text-muted-foreground/80 uppercase tracking-[0.12em] px-5">Stagiaire</TableHead>
                <TableHead className="text-[11px] font-medium text-muted-foreground/80 uppercase tracking-[0.12em] px-5">Groupe</TableHead>
                <TableHead className="text-[11px] font-medium text-muted-foreground/80 uppercase tracking-[0.12em] px-5">Date</TableHead>
                <TableHead className="text-[11px] font-medium text-muted-foreground/80 uppercase tracking-[0.12em] px-5">Période</TableHead>
                <TableHead className="text-[11px] font-medium text-muted-foreground/80 uppercase tracking-[0.12em] px-5">Type</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {overview?.latest_absences?.map((absence) => (
                <TableRow key={absence.id} className="hover:bg-muted/30 border-b border-border/30 last:border-0 transition-colors duration-150">
                  <TableCell className="text-[14px] font-medium text-foreground px-5 py-3">{getStagiaireFullName(absence.stagiaire)}</TableCell>
                  <TableCell className="text-[14px] text-muted-foreground px-5 py-3">{absence.groupe?.nom ?? '—'}</TableCell>
                  <TableCell className="text-[14px] text-muted-foreground tabular-nums px-5 py-3">{compactDate(absence.date_absence)}</TableCell>
                  <TableCell className="px-5 py-3"><PeriodBadge period={absence.periode} /></TableCell>
                  <TableCell className="px-5 py-3"><AbsenceTypeBadge type={absence.type} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
