'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FileCheck, Plus, Eye } from 'lucide-react';
import { toast } from 'sonner';
import {
  absenceService,
  autorisationService,
  getApiErrorMessage,
  groupeService,
  stagiaireService,
} from '@/services/api';
import type { Autorisation, StoreAutorisationPayload } from '@/types';
import { PageHeader } from '@/components/shared/page-header';
import { SearchInput } from '@/components/shared/search-input';
import { Pagination } from '@/components/shared/pagination';
import { EmptyState } from '@/components/shared/empty-state';
import { TableSkeleton } from '@/components/shared/loading-skeleton';
import { AutorisationStatusBadge, ReadStatusBadge } from '@/components/shared/status-badge';
import { AbsencesMultiSelect } from '@/components/shared/absences-multi-select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getStagiaireFullName, getUserFullName } from '@/utils/domain';
import { AutorisationDetailsDialog } from '@/components/shared/autorisation-details-dialog';
import { useAuthStore } from '@/store/auth.store';

const schema = z.object({
  groupe_id: z.string().min(1, 'Groupe requis'),
  stagiaire_id: z.string().min(1, 'Stagiaire requis'),
  absence_ids: z.array(z.string()).optional(),
  target_user_id: z.string().min(1, 'Formateur requis'),
  statut: z.enum(['validee', 'refusee']),
  motif: z.string().trim().optional(),
});

type FormValues = z.infer<typeof schema>;

const defaultValues: FormValues = {
  groupe_id: '',
  stagiaire_id: '',
  absence_ids: [],
  target_user_id: '',
  statut: 'validee',
  motif: '',
};

function toPayload(values: FormValues): StoreAutorisationPayload {
  const motif = values.motif?.trim();

  return {
    stagiaire_id: Number(values.stagiaire_id),
    absence_ids: (values.absence_ids ?? []).map(Number),
    target_user_id: Number(values.target_user_id),
    statut: values.statut,
    motif: motif ? motif : null,
  };
}

function matchesStagiaireSearch(haystack: string, term: string): boolean {
  const normalized = term.trim().toLowerCase();
  if (!normalized) return true;

  const tokens = normalized.split(/\s+/).filter(Boolean);
  return tokens.every((token) => haystack.includes(token));
}

export default function AutorisationsPage() {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);
  const [page, setPage] = useState(1);
  const [statutFilter, setStatutFilter] = useState('');
  const [search, setSearch] = useState('');
  const [stagiaireSearch, setStagiaireSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [selectedAutorisation, setSelectedAutorisation] = useState<Autorisation | null>(null);

  const { handleSubmit, reset, setValue, register, control, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const watchGroupeId = useWatch({ control, name: 'groupe_id' });
  const watchStagiaireId = useWatch({ control, name: 'stagiaire_id' });
  const watchAbsenceIds = useWatch({ control, name: 'absence_ids' }) ?? [];
  const watchTargetUserId = useWatch({ control, name: 'target_user_id' });
  const watchStatut = useWatch({ control, name: 'statut' });

  const { data, isLoading } = useQuery({
    queryKey: ['autorisations', page, statutFilter, search],
    queryFn: () => autorisationService.list({
      page,
      per_page: 10,
      statut: statutFilter || undefined,
      search: search || undefined,
    }),
  });

  const { data: groupes, isLoading: groupesLoading } = useQuery({
    queryKey: ['groupes', 'autorisation-form'],
    queryFn: () => groupeService.list({ per_page: 100 }),
    enabled: open,
  });

  const { data: stagiaires, isLoading: stagiairesLoading } = useQuery({
    queryKey: ['stagiaires', 'autorisation-form', watchGroupeId],
    queryFn: () => stagiaireService.list({
      groupe_id: Number(watchGroupeId),
      per_page: 100,
    }),
    enabled: open && Boolean(watchGroupeId),
  });

  // Recherche limitée au groupe : filtrage client par nom / prénom / nom complet / CEF.
  const filteredStagiaires = useMemo(() => {
    const list = stagiaires?.data ?? [];
    if (!stagiaireSearch.trim()) return list;

    return list.filter((stagiaire) => {
      const haystack = [
        stagiaire.prenom,
        stagiaire.nom,
        `${stagiaire.prenom} ${stagiaire.nom}`,
        `${stagiaire.nom} ${stagiaire.prenom}`,
        stagiaire.cef,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return matchesStagiaireSearch(haystack, stagiaireSearch);
    });
  }, [stagiaires?.data, stagiaireSearch]);

  const { data: selectedStagiaire, isLoading: selectedStagiaireLoading } = useQuery({
    queryKey: ['stagiaires', 'details', watchStagiaireId],
    queryFn: () => stagiaireService.get(Number(watchStagiaireId)),
    enabled: open && Boolean(watchStagiaireId),
  });

  const { data: absences, isLoading: absencesLoading } = useQuery({
    queryKey: ['absences', 'autorisation-form', watchStagiaireId],
    queryFn: () => absenceService.list({
      stagiaire_id: Number(watchStagiaireId),
      per_page: 100,
    }),
    enabled: open && Boolean(watchStagiaireId),
  });

  const eligibleAbsences = absences?.data.filter((absence) => !absence.autorisation) ?? [];

  const createMutation = useMutation({
    mutationFn: (payload: StoreAutorisationPayload) => autorisationService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['autorisations'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Autorisation créée.');
      closeDialog();
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Impossible de créer l\'autorisation.')),
  });

  const closeDialog = () => {
    setOpen(false);
    setStagiaireSearch('');
    reset(defaultValues);
  };

  const openDetails = (autorisation: Autorisation) => {
    setSelectedAutorisation(autorisation);
  };

  const closeDetails = () => {
    setSelectedAutorisation(null);
  };

  const formateurs = selectedStagiaire?.data.groupe?.formateurs ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Autorisations" description="Créer et suivre les autorisations de justification" icon={FileCheck}>
        <Button
          onClick={() => {
            reset(defaultValues);
            setStagiaireSearch('');
            setOpen(true);
          }}
          className="h-9 rounded-lg bg-primary px-4 text-[13px] font-medium text-white hover:bg-primary-hover"
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Nouvelle
        </Button>
      </PageHeader>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <SearchInput
          value={search}
          onChange={(value) => { setSearch(value); setPage(1); }}
          placeholder="Rechercher par CEF, nom, groupe ou code..."
          className="w-full sm:w-80"
        />
        <Select value={statutFilter} onValueChange={(value) => { setStatutFilter(value && value !== 'all' ? value : ''); setPage(1); }}>
          <SelectTrigger className="h-9 w-full rounded-lg border-border/50 bg-muted/30 text-[14px] sm:w-48">
            <SelectValue placeholder="Tous statuts" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="en_attente">En attente</SelectItem>
            <SelectItem value="validee">Acceptée</SelectItem>
            <SelectItem value="refusee">Refusée</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <TableSkeleton columns={8} />
      ) : !data?.data.length ? (
        <EmptyState title="Aucune autorisation" description="Aucune autorisation ne correspond aux filtres sélectionnés." icon={FileCheck} />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border/50 bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border/50 hover:bg-transparent">
                <TableHead className="px-5 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground/80">Code</TableHead>
                <TableHead className="px-5 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground/80">Stagiaire</TableHead>
                <TableHead className="hidden px-5 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground/80 md:table-cell">Groupe</TableHead>
                <TableHead className="px-5 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground/80">Formateur</TableHead>
                <TableHead className="px-5 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground/80">Statut</TableHead>
                <TableHead className="px-5 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground/80">Lecture</TableHead>
                <TableHead className="hidden px-5 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground/80 lg:table-cell">Motif</TableHead>
                <TableHead className="w-16 px-5 text-right text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground/80">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.data.map((autorisation) => (
                <TableRow key={autorisation.id} className="border-b border-border/30 transition-colors duration-150 last:border-0 hover:bg-muted/30">
                  <TableCell className="px-5 py-3 font-mono text-[13px] text-muted-foreground">{autorisation.code}</TableCell>
                  <TableCell className="px-5 py-3 text-[14px] font-medium text-foreground">{getStagiaireFullName(autorisation.stagiaire ?? autorisation.absence?.stagiaire)}</TableCell>
                  <TableCell className="hidden px-5 py-3 text-[14px] text-muted-foreground md:table-cell">{autorisation.stagiaire?.groupe?.nom ?? autorisation.absence?.groupe?.nom ?? autorisation.absence?.stagiaire?.groupe?.nom ?? '-'}</TableCell>
                  <TableCell className="px-5 py-3 text-[14px] text-muted-foreground">{getUserFullName(autorisation.target_user) || '-'}</TableCell>
                  <TableCell className="px-5 py-3"><AutorisationStatusBadge statut={autorisation.statut} /></TableCell>
                  <TableCell className="px-5 py-3"><ReadStatusBadge isRead={autorisation.is_read} /></TableCell>
                  <TableCell className="hidden max-w-[220px] truncate px-5 py-3 text-[14px] text-muted-foreground lg:table-cell">{autorisation.motif || '-'}</TableCell>
                  <TableCell className="px-5 py-3 text-right">
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      title="Voir les détails"
                      aria-label={`Voir les détails de ${autorisation.code}`}
                      onClick={() => openDetails(autorisation)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {data.meta && <div className="border-t border-border/40 bg-muted/30 px-4 py-2.5"><Pagination meta={data.meta} onPageChange={setPage} /></div>}
        </div>
      )}

      <Dialog open={open} onOpenChange={(value) => { if (!value) closeDialog(); }}>
        <DialogContent className="max-h-[calc(100vh-1.5rem)] overflow-y-auto sm:max-w-[560px]">
          <form onSubmit={handleSubmit((values) => createMutation.mutate(toPayload(values)))} noValidate className="space-y-3">
            <DialogHeader className="gap-1">
              <DialogTitle>Nouvelle autorisation</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                <Label>Groupe</Label>
                <Select
                  value={watchGroupeId}
                  onValueChange={(value) => {
                    setValue('groupe_id', value || '');
                    setValue('stagiaire_id', '');
                    setValue('absence_ids', []);
                    setValue('target_user_id', '');
                    setStagiaireSearch('');
                  }}
                >
                  <SelectTrigger className="h-9 rounded-lg border-border/50 bg-muted/30 text-[14px]">
                    <SelectValue placeholder={groupesLoading ? 'Chargement...' : 'Sélectionner un groupe'} />
                  </SelectTrigger>
                  <SelectContent>
                    {groupes?.data.map((groupe) => (
                      <SelectItem key={groupe.id} value={String(groupe.id)}>
                        {groupe.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.groupe_id && <p className="text-[12px] text-destructive">{errors.groupe_id.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label>Recherche stagiaire</Label>
                <SearchInput
                  value={stagiaireSearch}
                  onChange={setStagiaireSearch}
                  placeholder="Nom, prénom, nom complet ou CEF..."
                  className="w-full"
                />
              </div>
              </div>

              <div className="space-y-1.5">
                <Label>Stagiaire</Label>
                <Select
                  value={watchStagiaireId}
                  onValueChange={(value) => {
                    setValue('stagiaire_id', value || '');
                    setValue('absence_ids', []);
                    setValue('target_user_id', '');
                  }}
                >
                  <SelectTrigger disabled={!watchGroupeId || stagiairesLoading} className="h-9 rounded-lg border-border/50 bg-muted/30 text-[14px]">
                    <SelectValue placeholder={
                      !watchGroupeId
                        ? 'Sélectionner d\'abord un groupe'
                        : stagiairesLoading
                          ? 'Chargement...'
                          : 'Sélectionner un stagiaire'
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredStagiaires.map((stagiaire) => (
                      <SelectItem key={stagiaire.id} value={String(stagiaire.id)}>
                        {getStagiaireFullName(stagiaire)} - CEF {stagiaire.cef} - {stagiaire.groupe?.nom ?? '-'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.stagiaire_id && <p className="text-[12px] text-destructive">{errors.stagiaire_id.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label>Absences concernées (Optionnel)</Label>
                <AbsencesMultiSelect
                  options={eligibleAbsences}
                  value={watchAbsenceIds}
                  onChange={(next) => setValue('absence_ids', next)}
                  disabled={!watchStagiaireId}
                  loading={absencesLoading}
                  placeholder={
                    !watchStagiaireId
                      ? 'Sélectionner d\'abord un stagiaire'
                      : eligibleAbsences.length === 0
                        ? 'Aucune absence à justifier'
                        : 'Sélectionner une ou plusieurs absences'
                  }
                />
                <p className="text-[12px] text-muted-foreground">Nombre sélectionné : {watchAbsenceIds.length}</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                <Label>Formateur concerné</Label>
                <Select value={watchTargetUserId} onValueChange={(value) => setValue('target_user_id', value || '')}>
                  <SelectTrigger disabled={!watchStagiaireId || selectedStagiaireLoading} className="h-9 rounded-lg border-border/50 bg-muted/30 text-[14px]">
                    <SelectValue placeholder={selectedStagiaireLoading ? 'Chargement...' : 'Sélectionner'} />
                  </SelectTrigger>
                  <SelectContent>
                    {formateurs.map((formateur) => (
                      <SelectItem key={formateur.id} value={String(formateur.id)}>{getUserFullName(formateur)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.target_user_id && <p className="text-[12px] text-destructive">{errors.target_user_id.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label>Statut</Label>
                <Select value={watchStatut} onValueChange={(value) => setValue('statut', value as FormValues['statut'])}>
                  <SelectTrigger className="h-9 rounded-lg border-border/50 bg-muted/30 text-[14px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="validee">Acceptée</SelectItem>
                    <SelectItem value="refusee">Refusée</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              </div>

              <div className="space-y-1.5">
                <Label>Motif (optionnel)</Label>
                <Textarea
                  {...register('motif')}
                  className="min-h-[64px] rounded-lg border-border/50 bg-muted/30 text-[14px]"
                />
                {errors.motif && <p className="text-[12px] text-destructive">{errors.motif.message}</p>}
              </div>
            </div>
            <DialogFooter className="px-4 py-3">
              <Button type="button" variant="outline" onClick={closeDialog} disabled={createMutation.isPending} className="rounded-lg">Annuler</Button>
              <Button type="submit" disabled={createMutation.isPending} className="rounded-lg bg-primary text-white hover:bg-primary-hover">
                {createMutation.isPending ? 'Création...' : 'Créer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AutorisationDetailsDialog
        open={!!selectedAutorisation}
        autorisation={selectedAutorisation}
        onOpenChange={(value) => { if (!value) closeDetails(); }}
        currentUser={currentUser}
      />
    </div>
  );
}
