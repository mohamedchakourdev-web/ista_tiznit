'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, BookOpen, FileCheck, FolderOpen, GraduationCap } from 'lucide-react';
import { absenceService, autorisationService, filiereService, groupeService, stagiaireService } from '@/services/api';
import { PageHeader } from '@/components/shared/page-header';
import { StatsSkeleton, TableSkeleton } from '@/components/shared/loading-skeleton';
import { AbsenceTypeBadge, PeriodBadge } from '@/components/shared/status-badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { compactDate, getStagiaireFullName } from '@/utils/domain';

function totalOf(data?: { data: unknown[]; meta?: { total?: number } }) {
  return data?.meta?.total ?? data?.data?.length ?? 0;
}

export default function GestionnaireDashboard() {
  const filieres = useQuery({ queryKey: ['filieres', 'dashboard'], queryFn: () => filiereService.list({ per_page: 10 }) });
  const groupes = useQuery({ queryKey: ['groupes', 'dashboard'], queryFn: () => groupeService.list({ per_page: 10 }) });
  const stagiaires = useQuery({ queryKey: ['stagiaires', 'dashboard'], queryFn: () => stagiaireService.list({ per_page: 10 }) });
  const absences = useQuery({ queryKey: ['absences', 'dashboard'], queryFn: () => absenceService.list({ per_page: 10 }) });
  const autorisations = useQuery({ queryKey: ['autorisations', 'dashboard'], queryFn: () => autorisationService.list({ per_page: 10 }) });

  const isLoading = filieres.isLoading || groupes.isLoading || stagiaires.isLoading || absences.isLoading || autorisations.isLoading;

  const cards = [
    { label: 'Filières', value: totalOf(filieres.data), icon: FolderOpen, desc: 'Filières disponibles', href: '/gestionnaire/filieres' },
    { label: 'Groupes', value: totalOf(groupes.data), icon: BookOpen, desc: 'Groupes de formation', href: '/gestionnaire/groupes' },
    { label: 'Stagiaires', value: totalOf(stagiaires.data), icon: GraduationCap, desc: 'Inscrits suivis', href: '/gestionnaire/stagiaires' },
    { label: 'Absences', value: totalOf(absences.data), icon: AlertTriangle, desc: 'Absences enregistrées', href: '/gestionnaire/absences' },
    { label: 'Autorisations', value: totalOf(autorisations.data), icon: FileCheck, desc: 'Demandes créées', href: '/gestionnaire/autorisations' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Tableau de bord" description="Vue d'ensemble de la gestion des absences" />

      {isLoading ? (
        <StatsSkeleton count={5} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {cards.map((card) => (
            <Link key={card.label} href={card.href}>
              <div className="group rounded-xl border border-border/50 bg-card p-5 hover:border-border/70 hover:shadow-[0_1px_4px_rgba(0,0,0,0.03)] transition-all duration-200 cursor-pointer">
                <div className="flex items-center justify-between mb-5">
                  <span className="text-[13px] font-medium text-muted-foreground">{card.label}</span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted/50 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors duration-200">
                    <card.icon className="h-4 w-4" />
                  </div>
                </div>
                <p className="text-[28px] font-semibold tracking-tight leading-none">{card.value}</p>
                <p className="text-[13px] text-muted-foreground mt-1.5">{card.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {absences.isLoading ? (
        <TableSkeleton columns={5} rows={5} />
      ) : (
        <div className="rounded-xl border border-border/50 bg-card shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border/50">
            <h2 className="text-[14px] font-semibold text-foreground">Absences récentes</h2>
            <p className="text-[13px] text-muted-foreground mt-0.5">Dernières absences reçues depuis l&apos;API Laravel</p>
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
              {absences.data?.data.slice(0, 8).map((absence) => (
                <TableRow key={absence.id} className="hover:bg-muted/30 border-b border-border/30 last:border-0 transition-colors duration-150">
                  <TableCell className="text-[14px] font-medium text-foreground px-5 py-3">{getStagiaireFullName(absence.stagiaire)}</TableCell>
                  <TableCell className="text-[14px] text-muted-foreground px-5 py-3">{absence.groupe?.nom ?? absence.stagiaire?.groupe?.nom ?? '—'}</TableCell>
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
