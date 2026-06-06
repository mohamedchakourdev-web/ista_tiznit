'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertTriangle, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { absenceService, getApiErrorMessage, groupeService, stagiaireService } from '@/services/api';
import type { StoreAbsencePayload } from '@/types';
import { PageHeader } from '@/components/shared/page-header';
import { SearchInput } from '@/components/shared/search-input';
import { Pagination } from '@/components/shared/pagination';
import { EmptyState } from '@/components/shared/empty-state';
import { TableSkeleton } from '@/components/shared/loading-skeleton';
import { AbsenceTypeBadge, AutorisationStatusBadge, PeriodBadge, StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { compactDate, getStagiaireFullName } from '@/utils/domain';

const schema = z.object({
  groupe_id: z.string().min(1, 'Groupe requis'),
  stagiaire_id: z.string().min(1, 'Stagiaire requis'),
  date_absence: z.string().min(1, 'Date requise'),
  periode: z.enum(['matin', 'apres_midi']),
  type: z.enum(['absence', 'retard']),
  minutes_retard: z.string().optional(),
  remarque: z.string().optional(),
}).superRefine((values, context) => {
  if (values.type === 'retard' && !values.minutes_retard) {
    context.addIssue({
      code: 'custom',
      path: ['minutes_retard'],
      message: 'Minutes de retard requises',
    });
  }
});

type FormValues = z.infer<typeof schema>;

const defaultValues: FormValues = {
  groupe_id: '',
  stagiaire_id: '',
  date_absence: new Date().toISOString().slice(0, 10),
  periode: 'matin',
  type: 'absence',
  minutes_retard: '',
  remarque: '',
};

function toPayload(values: FormValues): StoreAbsencePayload {
  const payload: StoreAbsencePayload = {
    stagiaire_id: Number(values.stagiaire_id),
    groupe_id: Number(values.groupe_id),
    date_absence: values.date_absence,
    periode: values.periode,
    type: values.type,
  };

  if (values.type === 'retard') {
    payload.minutes_retard = Number(values.minutes_retard);
  }

  if (values.remarque) {
    payload.remarque = values.remarque;
  }

  return payload;
}

export default function AbsencesPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [groupeFilter, setGroupeFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [open, setOpen] = useState(false);

  const { register, handleSubmit, reset, setValue, control, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const watchGroupeId = useWatch({ control, name: 'groupe_id' });
  const watchStagiaireId = useWatch({ control, name: 'stagiaire_id' });
  const watchPeriode = useWatch({ control, name: 'periode' });
  const watchType = useWatch({ control, name: 'type' });

  const { data, isLoading } = useQuery({
    queryKey: ['absences', page, search, typeFilter, groupeFilter, dateFilter],
    queryFn: () => absenceService.list({
      page,
      per_page: 10,
      search: search || undefined,
      type: typeFilter || undefined,
      groupe_id: groupeFilter || undefined,
      date_absence: dateFilter || undefined,
    }),
  });

  const { data: groupes } = useQuery({
    queryKey: ['groupes', 'options'],
    queryFn: () => groupeService.list({ per_page: 100 }),
  });

  const { data: stagiaires } = useQuery({
    queryKey: ['stagiaires', 'absence-form', watchGroupeId],
    queryFn: () => stagiaireService.list({ per_page: 100, groupe_id: watchGroupeId || undefined }),
    enabled: open && Boolean(watchGroupeId),
  });

  const createMutation = useMutation({
    mutationFn: (payload: StoreAbsencePayload) => absenceService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['absences'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Absence enregistree.');
      closeDialog();
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Impossible d enregistrer l absence.')),
  });

  const openCreate = () => {
    reset(defaultValues);
    setOpen(true);
  };

  const closeDialog = () => {
    setOpen(false);
    reset(defaultValues);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Absences" description="Historique des absences et retards enregistres" icon={AlertTriangle}>
        <Button onClick={openCreate} className="h-9 rounded-lg bg-primary px-4 text-[13px] font-medium text-white hover:bg-primary-hover">
          <Plus className="mr-1.5 h-4 w-4" />
          Nouvelle absence
        </Button>
      </PageHeader>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <SearchInput
          value={search}
          onChange={(value) => { setSearch(value); setPage(1); }}
          placeholder="Rechercher CEF, nom, groupe..."
          className="w-full sm:w-80"
        />
        <Select value={groupeFilter} onValueChange={(value) => { setGroupeFilter(value && value !== 'all' ? value : ''); setPage(1); }}>
          <SelectTrigger className="h-9 w-full rounded-lg border-border/50 bg-muted/30 text-[14px] sm:w-[220px]">
            <SelectValue placeholder="Tous groupes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous groupes</SelectItem>
            {groupes?.data.map((groupe) => (
              <SelectItem key={groupe.id} value={String(groupe.id)}>{groupe.nom}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={(value) => { setTypeFilter(value && value !== 'all' ? value : ''); setPage(1); }}>
          <SelectTrigger className="h-9 w-full rounded-lg border-border/50 bg-muted/30 text-[14px] sm:w-[180px]">
            <SelectValue placeholder="Tous types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous types</SelectItem>
            <SelectItem value="absence">Absence</SelectItem>
            <SelectItem value="retard">Retard</SelectItem>
          </SelectContent>
        </Select>
        <Input
          type="date"
          value={dateFilter}
          onChange={(event) => { setDateFilter(event.target.value); setPage(1); }}
          className="h-9 w-full rounded-lg border-border/50 bg-muted/30 text-[14px] sm:w-[180px]"
        />
      </div>

      {isLoading ? (
        <TableSkeleton columns={7} />
      ) : !data?.data.length ? (
        <EmptyState title="Aucune absence" description="Aucune absence ne correspond aux filtres selectionnes." icon={AlertTriangle} />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border/50 bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border/50 hover:bg-transparent">
                <TableHead className="px-5 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground/80">Stagiaire</TableHead>
                <TableHead className="px-5 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground/80">Groupe</TableHead>
                <TableHead className="px-5 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground/80">Date</TableHead>
                <TableHead className="px-5 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground/80">Periode</TableHead>
                <TableHead className="px-5 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground/80">Type</TableHead>
                <TableHead className="hidden px-5 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground/80 lg:table-cell">Retard</TableHead>
                <TableHead className="px-5 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground/80">Autorisation</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.data.map((absence) => (
                <TableRow key={absence.id} className="border-b border-border/30 transition-colors duration-150 last:border-0 hover:bg-muted/30">
                  <TableCell className="px-5 py-3 text-[14px] font-medium text-foreground">{getStagiaireFullName(absence.stagiaire)}</TableCell>
                  <TableCell className="px-5 py-3 text-[14px] text-muted-foreground">{absence.groupe?.nom ?? absence.stagiaire?.groupe?.nom ?? '-'}</TableCell>
                  <TableCell className="px-5 py-3 text-[14px] tabular-nums text-muted-foreground">{compactDate(absence.date_absence)}</TableCell>
                  <TableCell className="px-5 py-3"><PeriodBadge period={absence.periode} /></TableCell>
                  <TableCell className="px-5 py-3"><AbsenceTypeBadge type={absence.type} /></TableCell>
                  <TableCell className="hidden px-5 py-3 text-[14px] text-muted-foreground lg:table-cell">{absence.minutes_retard ? `${absence.minutes_retard} min` : '-'}</TableCell>
                  <TableCell className="px-5 py-3">
                    {absence.autorisation ? (
                      <AutorisationStatusBadge statut={absence.autorisation.statut} />
                    ) : (
                      <StatusBadge variant="neutral">Aucune</StatusBadge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {data.meta && <div className="border-t border-border/40 bg-muted/30 px-4 py-2.5"><Pagination meta={data.meta} onPageChange={setPage} /></div>}
        </div>
      )}

      <Dialog open={open} onOpenChange={(value) => { if (!value) closeDialog(); }}>
        <DialogContent className="sm:max-w-[620px]">
          <form onSubmit={handleSubmit((values) => createMutation.mutate(toPayload(values)))} noValidate className="space-y-4">
            <DialogHeader>
              <DialogTitle>Nouvelle absence</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Groupe</Label>
                <Select
                  value={watchGroupeId}
                  onValueChange={(value) => {
                    setValue('groupe_id', value || '');
                    setValue('stagiaire_id', '');
                  }}
                >
                  <SelectTrigger className="h-9 rounded-lg border-border/50 bg-muted/30 text-[14px]">
                    <SelectValue placeholder="Selectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {groupes?.data.map((groupe) => (
                      <SelectItem key={groupe.id} value={String(groupe.id)}>{groupe.nom}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.groupe_id && <p className="text-[12px] text-destructive">{errors.groupe_id.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Stagiaire</Label>
                <Select value={watchStagiaireId} onValueChange={(value) => setValue('stagiaire_id', value || '')}>
                  <SelectTrigger className="h-9 rounded-lg border-border/50 bg-muted/30 text-[14px]">
                    <SelectValue placeholder="Selectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {stagiaires?.data.map((stagiaire) => (
                      <SelectItem key={stagiaire.id} value={String(stagiaire.id)}>{getStagiaireFullName(stagiaire)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.stagiaire_id && <p className="text-[12px] text-destructive">{errors.stagiaire_id.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date" {...register('date_absence')} className="h-9 rounded-lg border-border/50 bg-muted/30 text-[14px]" />
                {errors.date_absence && <p className="text-[12px] text-destructive">{errors.date_absence.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Periode</Label>
                <Select value={watchPeriode} onValueChange={(value) => setValue('periode', value as FormValues['periode'])}>
                  <SelectTrigger className="h-9 rounded-lg border-border/50 bg-muted/30 text-[14px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="matin">Matin</SelectItem>
                    <SelectItem value="apres_midi">Apres-midi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={watchType} onValueChange={(value) => setValue('type', value as FormValues['type'])}>
                  <SelectTrigger className="h-9 rounded-lg border-border/50 bg-muted/30 text-[14px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="absence">Absence</SelectItem>
                    <SelectItem value="retard">Retard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {watchType === 'retard' && (
                <div className="space-y-2">
                  <Label>Minutes de retard</Label>
                  <Input type="number" min={1} {...register('minutes_retard')} className="h-9 rounded-lg border-border/50 bg-muted/30 text-[14px]" />
                  {errors.minutes_retard && <p className="text-[12px] text-destructive">{errors.minutes_retard.message}</p>}
                </div>
              )}
              <div className="space-y-2 sm:col-span-2">
                <Label>Remarque</Label>
                <Textarea {...register('remarque')} className="min-h-[86px] rounded-lg border-border/50 bg-muted/30 text-[14px]" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog} disabled={createMutation.isPending} className="rounded-lg">Annuler</Button>
              <Button type="submit" disabled={createMutation.isPending} className="rounded-lg bg-primary text-white hover:bg-primary-hover">
                {createMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
