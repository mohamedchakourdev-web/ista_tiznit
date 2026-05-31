'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { BookOpen, Check, ChevronsUpDown, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { filiereService, getApiErrorMessage, groupeService } from '@/services/api';
import type { Groupe, StoreGroupePayload, User } from '@/types';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/shared/page-header';
import { SearchInput } from '@/components/shared/search-input';
import { Pagination } from '@/components/shared/pagination';
import { EmptyState } from '@/components/shared/empty-state';
import { TableSkeleton } from '@/components/shared/loading-skeleton';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { FiliereSelect } from '@/components/shared/filiere-select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getGroupeFiliereName, getUserFullName } from '@/utils/domain';

const schema = z.object({
  filiere_id: z.string().min(1, 'Filière requise'),
  nom: z.string().min(1, 'Nom requis'),
  code: z.string().min(1, 'Code requis'),
  annee_formation: z.string().min(1, 'Année requise'),
  niveau: z.string().min(1, 'Niveau requis'),
  capacite: z.string().optional(),
  formateur_ids: z.array(z.number()),
});

type FormValues = z.infer<typeof schema>;

function getFormateurOptionLabel(formateur: User): string {
  return getUserFullName(formateur) || formateur.email;
}

export default function GroupesPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filiereFilter, setFiliereFilter] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Groupe | null>(null);
  const [deleting, setDeleting] = useState<Groupe | null>(null);

  const { register, handleSubmit, reset, control, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { filiere_id: '', nom: '', code: '', annee_formation: '', niveau: '', capacite: '', formateur_ids: [] },
  });

  const watchFiliereId = useWatch({ control, name: 'filiere_id' });
  const watchFormateurIds = useWatch({ control, name: 'formateur_ids' }) ?? [];

  const { data, isLoading } = useQuery({
    queryKey: ['groupes', page, search, filiereFilter],
    queryFn: () => groupeService.list({ page, per_page: 10, search: search || undefined, filiere_id: filiereFilter || undefined }),
  });

  const { data: filieres } = useQuery({
    queryKey: ['filieres', 'options'],
    queryFn: () => filiereService.list({ per_page: 100 }),
  });
  const filiereOptions = filieres?.data ?? [];

  const { data: formateurs, isLoading: formateursLoading } = useQuery({
    queryKey: ['formateurs', 'options'],
    queryFn: () => groupeService.formateurs({ per_page: 100 }),
  });

  const formateurOptions = formateurs?.data ?? [];
  const selectedFormateurs = watchFormateurIds
    .map((id) => formateurOptions.find((formateur) => formateur.id === id) ?? editing?.formateurs?.find((formateur) => formateur.id === id))
    .filter((formateur): formateur is User => Boolean(formateur));
  const selectedFormateursLabel = selectedFormateurs.length === 0
    ? 'Sélectionner les formateurs'
    : selectedFormateurs.length <= 2
      ? selectedFormateurs.map(getFormateurOptionLabel).join(', ')
      : `${selectedFormateurs.slice(0, 2).map(getFormateurOptionLabel).join(', ')} +${selectedFormateurs.length - 2}`;

  const toggleFormateur = (formateurId: number) => {
    const nextIds = watchFormateurIds.includes(formateurId)
      ? watchFormateurIds.filter((id) => id !== formateurId)
      : [...watchFormateurIds, formateurId];

    setValue('formateur_ids', nextIds, { shouldDirty: true, shouldValidate: true });
  };

  const createMutation = useMutation({
    mutationFn: (payload: StoreGroupePayload) => groupeService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groupes'] });
      toast.success('Groupe créé.');
      closeDialog();
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Impossible de créer le groupe.')),
  });

  const updateMutation = useMutation({
    mutationFn: (payload: StoreGroupePayload) => groupeService.update(editing!.id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groupes'] });
      toast.success('Groupe modifié.');
      closeDialog();
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Impossible de modifier le groupe.')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => groupeService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groupes'] });
      toast.success('Groupe supprimé.');
      setDeleting(null);
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Impossible de supprimer le groupe.')),
  });

  const openCreate = () => {
    setEditing(null);
    reset({ filiere_id: '', nom: '', code: '', annee_formation: '', niveau: '', capacite: '', formateur_ids: [] });
    setOpen(true);
  };

  const openEdit = (groupe: Groupe) => {
    setEditing(groupe);
    reset({
      filiere_id: String(groupe.filiere_id ?? groupe.filiere?.id ?? ''),
      nom: groupe.nom,
      code: groupe.code,
      annee_formation: groupe.annee_formation,
      niveau: groupe.niveau,
      capacite: groupe.capacite ? String(groupe.capacite) : '',
      formateur_ids: groupe.formateurs?.map((formateur) => formateur.id) ?? [],
    });
    setOpen(true);
  };

  const closeDialog = () => {
    setOpen(false);
    setEditing(null);
  };

  const toPayload = (values: FormValues): StoreGroupePayload => ({
    filiere_id: Number(values.filiere_id),
    nom: values.nom,
    code: values.code,
    annee_formation: values.annee_formation,
    niveau: values.niveau,
    capacite: values.capacite ? Number(values.capacite) : null,
    formateur_ids: values.formateur_ids,
  });

  const onSubmit = (values: FormValues) => {
    const payload = toPayload(values);
    if (editing) updateMutation.mutate(payload);
    else createMutation.mutate(payload);
  };

  const saving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <PageHeader title="Groupes" description="Groupes de formation et capacité pédagogique" icon={BookOpen}>
        <Button onClick={openCreate} className="bg-primary hover:bg-primary-hover text-white rounded-lg text-[13px] font-medium h-9 px-4 transition-colors">
          <Plus className="mr-1.5 h-4 w-4" />
          Nouveau groupe
        </Button>
      </PageHeader>

      <div className="flex flex-col sm:flex-row gap-3">
        <SearchInput value={search} onChange={(value) => { setSearch(value); setPage(1); }} className="w-full sm:w-80" />
        <FiliereSelect
          filieres={filiereOptions}
          value={filiereFilter}
          onValueChange={(value) => { setFiliereFilter(value && value !== 'all' ? value : ''); setPage(1); }}
          placeholder="Toutes filières"
          includeAll
          allLabel="Toutes filières"
          className="sm:w-[360px]"
        />
      </div>

      {isLoading ? (
        <TableSkeleton columns={7} />
      ) : !data?.data.length ? (
        <EmptyState title="Aucun groupe" description="Créez un groupe à partir d'une filière existante." icon={BookOpen} />
      ) : (
        <div className="rounded-xl border border-border/50 bg-card shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b border-border/50">
                <TableHead className="text-[11px] font-medium text-muted-foreground/80 uppercase tracking-[0.12em] px-5">Nom</TableHead>
                <TableHead className="text-[11px] font-medium text-muted-foreground/80 uppercase tracking-[0.12em] px-5">Code</TableHead>
                <TableHead className="text-[11px] font-medium text-muted-foreground/80 uppercase tracking-[0.12em] px-5">Filière</TableHead>
                <TableHead className="text-[11px] font-medium text-muted-foreground/80 uppercase tracking-[0.12em] px-5">Année</TableHead>
                <TableHead className="text-[11px] font-medium text-muted-foreground/80 uppercase tracking-[0.12em] px-5">Niveau</TableHead>
                <TableHead className="text-[11px] font-medium text-muted-foreground/80 uppercase tracking-[0.12em] px-5">Stagiaires</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.data.map((groupe) => (
                <TableRow key={groupe.id} className="hover:bg-muted/30 border-b border-border/30 last:border-0 transition-colors duration-150">
                  <TableCell className="text-[14px] font-medium text-foreground px-5 py-3">{groupe.nom}</TableCell>
                  <TableCell className="text-[14px] text-muted-foreground px-5 py-3">{groupe.code}</TableCell>
                  <TableCell className="min-w-[240px] whitespace-normal break-words text-[14px] text-muted-foreground px-5 py-3">{getGroupeFiliereName(groupe)}</TableCell>
                  <TableCell className="text-[14px] text-muted-foreground px-5 py-3">{groupe.annee_formation}</TableCell>
                  <TableCell className="text-[14px] text-muted-foreground px-5 py-3">{groupe.niveau}</TableCell>
                  <TableCell className="text-[14px] text-muted-foreground px-5 py-3">{groupe.stagiaires_count ?? '—'}</TableCell>
                  <TableCell className="px-5 py-3 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger className="inline-flex items-center justify-center h-8 w-8 rounded-lg hover:bg-muted/60 text-muted-foreground/70 hover:text-foreground transition-colors duration-150">
                        <MoreHorizontal className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-36 rounded-lg p-1 border-border/50 shadow-sm">
                        <DropdownMenuItem onClick={() => openEdit(groupe)} className="text-[13px] gap-2">
                          <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setDeleting(groupe)} className="text-[13px] gap-2 text-destructive focus:text-destructive">
                          <Trash2 className="h-3.5 w-3.5" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {data.meta && <div className="border-t border-border/40 px-4 py-2.5 bg-muted/30"><Pagination meta={data.meta} onPageChange={setPage} /></div>}
        </div>
      )}

      <Dialog open={open} onOpenChange={(value) => { if (!value) closeDialog(); }}>
        <DialogContent className="sm:max-w-[620px]">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <DialogHeader>
              <DialogTitle>{editing ? 'Modifier le groupe' : 'Nouveau groupe'}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nom</Label>
                <Input {...register('nom')} className="h-9 rounded-lg border-border/50 bg-muted/30 text-[14px]" />
                {errors.nom && <p className="text-[12px] text-destructive">{errors.nom.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Code</Label>
                <Input {...register('code')} className="h-9 rounded-lg border-border/50 bg-muted/30 text-[14px]" />
                {errors.code && <p className="text-[12px] text-destructive">{errors.code.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Filière</Label>
                <FiliereSelect
                  filieres={filiereOptions}
                  value={watchFiliereId}
                  onValueChange={(value) => setValue('filiere_id', value || '', { shouldDirty: true, shouldValidate: true })}
                  placeholder="Sélectionner"
                />
                {errors.filiere_id && <p className="text-[12px] text-destructive">{errors.filiere_id.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Année formation</Label>
                <Input {...register('annee_formation')} placeholder="2025/2026" className="h-9 rounded-lg border-border/50 bg-muted/30 text-[14px]" />
                {errors.annee_formation && <p className="text-[12px] text-destructive">{errors.annee_formation.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Niveau</Label>
                <Input {...register('niveau')} className="h-9 rounded-lg border-border/50 bg-muted/30 text-[14px]" />
                {errors.niveau && <p className="text-[12px] text-destructive">{errors.niveau.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Capacité</Label>
                <Input type="number" min={1} max={100} {...register('capacite')} className="h-9 rounded-lg border-border/50 bg-muted/30 text-[14px]" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Formateurs affectés</Label>
                <Popover>
                  <PopoverTrigger
                    render={
                      <Button
                        type="button"
                        variant="outline"
                        className="h-9 w-full justify-between rounded-lg border-border/50 bg-muted/30 px-3 text-left text-[14px] font-normal hover:bg-muted/40"
                      />
                    }
                  >
                    <span className={cn('truncate', selectedFormateurs.length === 0 && 'text-muted-foreground')}>
                      {selectedFormateursLabel}
                    </span>
                    <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-[560px] max-w-[calc(100vw-2rem)] p-1">
                    <div className="max-h-56 overflow-y-auto">
                      {formateursLoading ? (
                        <div className="px-2 py-2 text-[13px] text-muted-foreground">Chargement...</div>
                      ) : !formateurOptions.length ? (
                        <div className="px-2 py-2 text-[13px] text-muted-foreground">Aucun formateur actif.</div>
                      ) : (
                        formateurOptions.map((formateur) => {
                          const isSelected = watchFormateurIds.includes(formateur.id);

                          return (
                            <button
                              key={formateur.id}
                              type="button"
                              onClick={() => toggleFormateur(formateur.id)}
                              className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left outline-none transition-colors hover:bg-muted/60 focus:bg-muted/60"
                            >
                              <span
                                className={cn(
                                  'flex size-4 shrink-0 items-center justify-center rounded-[4px] border',
                                  isSelected
                                    ? 'border-primary bg-primary text-primary-foreground'
                                    : 'border-input bg-background',
                                )}
                              >
                                {isSelected && <Check className="size-3" />}
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-[13px] font-medium text-foreground">
                                  {getFormateurOptionLabel(formateur)}
                                </span>
                                <span className="block truncate text-[12px] text-muted-foreground">
                                  {formateur.email}
                                </span>
                              </span>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog} disabled={saving} className="rounded-lg">Annuler</Button>
              <Button type="submit" disabled={saving} className="rounded-lg bg-primary hover:bg-primary-hover text-white">
                {saving ? 'Enregistrement...' : editing ? 'Modifier' : 'Créer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(value) => { if (!value) setDeleting(null); }}
        onConfirm={() => { if (deleting) deleteMutation.mutate(deleting.id); }}
        title="Supprimer le groupe"
        description="Voulez-vous vraiment supprimer ce groupe ? Cette action est irréversible."
        confirmLabel="Supprimer"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
