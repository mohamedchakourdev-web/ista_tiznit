'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FileCheck, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { absenceService, autorisationService, getApiErrorMessage } from '@/services/api';
import type { StoreAutorisationPayload } from '@/types';
import { PageHeader } from '@/components/shared/page-header';
import { Pagination } from '@/components/shared/pagination';
import { EmptyState } from '@/components/shared/empty-state';
import { TableSkeleton } from '@/components/shared/loading-skeleton';
import { AutorisationStatusBadge, ReadStatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { compactDate, describeAbsence, getStagiaireFullName, getUserFullName } from '@/utils/domain';

const schema = z.object({
  absence_id: z.string().min(1, 'Absence requise'),
  target_user_id: z.string().min(1, 'Formateur requis'),
  motif: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const defaultValues: FormValues = {
  absence_id: '',
  target_user_id: '',
  motif: '',
};

function toPayload(values: FormValues): StoreAutorisationPayload {
  return {
    absence_id: Number(values.absence_id),
    target_user_id: Number(values.target_user_id),
    motif: values.motif || null,
  };
}

export default function AutorisationsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statutFilter, setStatutFilter] = useState('');
  const [open, setOpen] = useState(false);

  const { handleSubmit, reset, setValue, control, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const watchAbsenceId = useWatch({ control, name: 'absence_id' });
  const watchTargetUserId = useWatch({ control, name: 'target_user_id' });

  const { data, isLoading } = useQuery({
    queryKey: ['autorisations', page, statutFilter],
    queryFn: () => autorisationService.list({
      page,
      per_page: 10,
      statut: statutFilter || undefined,
    }),
  });

  const { data: absences } = useQuery({
    queryKey: ['absences', 'autorisation-form'],
    queryFn: () => absenceService.list({ per_page: 100 }),
    enabled: open,
  });

  const { data: selectedAbsence, isLoading: selectedAbsenceLoading } = useQuery({
    queryKey: ['absences', 'details', watchAbsenceId],
    queryFn: () => absenceService.get(Number(watchAbsenceId)),
    enabled: open && Boolean(watchAbsenceId),
  });

  const createMutation = useMutation({
    mutationFn: (payload: StoreAutorisationPayload) => autorisationService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['autorisations'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Autorisation creee.');
      closeDialog();
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Impossible de creer l autorisation.')),
  });

  const closeDialog = () => {
    setOpen(false);
    reset(defaultValues);
  };

  const formateurs = selectedAbsence?.data.groupe?.formateurs ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Autorisations" description="Creer et suivre les autorisations de justification" icon={FileCheck}>
        <Button
          onClick={() => {
            reset(defaultValues);
            setOpen(true);
          }}
          className="h-9 rounded-lg bg-primary px-4 text-[13px] font-medium text-white hover:bg-primary-hover"
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Nouvelle
        </Button>
      </PageHeader>

      <Select value={statutFilter} onValueChange={(value) => { setStatutFilter(value && value !== 'all' ? value : ''); setPage(1); }}>
        <SelectTrigger className="h-9 w-full rounded-lg border-border/50 bg-muted/30 text-[14px] sm:w-48">
          <SelectValue placeholder="Tous statuts" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous</SelectItem>
          <SelectItem value="en_attente">En attente</SelectItem>
          <SelectItem value="validee">Validee</SelectItem>
          <SelectItem value="refusee">Refusee</SelectItem>
        </SelectContent>
      </Select>

      {isLoading ? (
        <TableSkeleton columns={7} />
      ) : !data?.data.length ? (
        <EmptyState title="Aucune autorisation" description="Aucune autorisation ne correspond aux filtres selectionnes." icon={FileCheck} />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border/50 bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border/50 hover:bg-transparent">
                <TableHead className="px-5 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground/80">Code</TableHead>
                <TableHead className="px-5 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground/80">Stagiaire</TableHead>
                <TableHead className="hidden px-5 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground/80 md:table-cell">Date</TableHead>
                <TableHead className="px-5 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground/80">Formateur</TableHead>
                <TableHead className="px-5 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground/80">Statut</TableHead>
                <TableHead className="px-5 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground/80">Lecture</TableHead>
                <TableHead className="hidden px-5 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground/80 lg:table-cell">Motif</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.data.map((autorisation) => (
                <TableRow key={autorisation.id} className="border-b border-border/30 transition-colors duration-150 last:border-0 hover:bg-muted/30">
                  <TableCell className="px-5 py-3 font-mono text-[13px] text-muted-foreground">{autorisation.code}</TableCell>
                  <TableCell className="px-5 py-3 text-[14px] font-medium text-foreground">{getStagiaireFullName(autorisation.absence?.stagiaire)}</TableCell>
                  <TableCell className="hidden px-5 py-3 text-[14px] tabular-nums text-muted-foreground md:table-cell">{compactDate(autorisation.absence?.date_absence)}</TableCell>
                  <TableCell className="px-5 py-3 text-[14px] text-muted-foreground">{getUserFullName(autorisation.target_user) || '-'}</TableCell>
                  <TableCell className="px-5 py-3"><AutorisationStatusBadge statut={autorisation.statut} /></TableCell>
                  <TableCell className="px-5 py-3"><ReadStatusBadge isRead={autorisation.is_read} /></TableCell>
                  <TableCell className="hidden max-w-[220px] truncate px-5 py-3 text-[14px] text-muted-foreground lg:table-cell">{autorisation.motif || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {data.meta && <div className="border-t border-border/40 bg-muted/30 px-4 py-2.5"><Pagination meta={data.meta} onPageChange={setPage} /></div>}
        </div>
      )}

      <Dialog open={open} onOpenChange={(value) => { if (!value) closeDialog(); }}>
        <DialogContent className="sm:max-w-[560px]">
          <form onSubmit={handleSubmit((values) => createMutation.mutate(toPayload(values)))} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Nouvelle autorisation</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Absence</Label>
                <Select
                  value={watchAbsenceId}
                  onValueChange={(value) => {
                    setValue('absence_id', value || '');
                    setValue('target_user_id', '');
                  }}
                >
                  <SelectTrigger className="h-9 rounded-lg border-border/50 bg-muted/30 text-[14px]">
                    <SelectValue placeholder="Selectionner une absence" />
                  </SelectTrigger>
                  <SelectContent>
                    {absences?.data.map((absence) => (
                      <SelectItem key={absence.id} value={String(absence.id)}>{describeAbsence(absence)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.absence_id && <p className="text-[12px] text-destructive">{errors.absence_id.message}</p>}
              </div>

              <div className="space-y-2">
                <Label>Formateur cible</Label>
                <Select value={watchTargetUserId} onValueChange={(value) => setValue('target_user_id', value || '')}>
                  <SelectTrigger className="h-9 rounded-lg border-border/50 bg-muted/30 text-[14px]">
                    <SelectValue placeholder={selectedAbsenceLoading ? 'Chargement...' : 'Selectionner'} />
                  </SelectTrigger>
                  <SelectContent>
                    {formateurs.map((formateur) => (
                      <SelectItem key={formateur.id} value={String(formateur.id)}>{getUserFullName(formateur)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.target_user_id && <p className="text-[12px] text-destructive">{errors.target_user_id.message}</p>}
              </div>

              <div className="space-y-2">
                <Label>Motif</Label>
                <Textarea
                  onChange={(event) => setValue('motif', event.target.value)}
                  className="min-h-[90px] rounded-lg border-border/50 bg-muted/30 text-[14px]"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog} disabled={createMutation.isPending} className="rounded-lg">Annuler</Button>
              <Button type="submit" disabled={createMutation.isPending} className="rounded-lg bg-primary text-white hover:bg-primary-hover">
                {createMutation.isPending ? 'Creation...' : 'Creer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
