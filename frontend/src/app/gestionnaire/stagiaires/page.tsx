'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { GraduationCap, MoreHorizontal, Pencil, Plus, Upload, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  diplomeService,
  getApiErrorMessage,
  groupeService,
  stagiaireService,
} from '@/services/api';
import type { Stagiaire, StoreStagiairePayload } from '@/types';
import { PageHeader } from '@/components/shared/page-header';
import { SearchInput } from '@/components/shared/search-input';
import { Pagination } from '@/components/shared/pagination';
import { EmptyState } from '@/components/shared/empty-state';
import { TableSkeleton } from '@/components/shared/loading-skeleton';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getStagiaireFullName } from '@/utils/domain';

const schema = z.object({
  groupe_id: z.string().min(1, 'Groupe requis'),
  diplome_type_id: z.string().min(1, 'Type de diplome requis'),
  cef: z.string().min(1, 'CEF requis').max(30, 'CEF trop long'),
  nom: z.string().min(1, 'Nom requis').max(100, 'Nom trop long'),
  prenom: z.string().min(1, 'Prenom requis').max(100, 'Prenom trop long'),
  cin: z.string().min(1, 'CIN requise').max(30, 'CIN trop longue'),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  telephone: z.string().max(30, 'Telephone trop long').optional(),
  date_naissance: z.string().optional(),
  adresse: z.string().max(255, 'Adresse trop longue').optional(),
  ville: z.string().max(100, 'Ville trop longue').optional(),
  sexe: z.enum(['homme', 'femme']),
});

type FormValues = z.infer<typeof schema>;

const defaultValues: FormValues = {
  groupe_id: '',
  diplome_type_id: '',
  cef: '',
  nom: '',
  prenom: '',
  cin: '',
  email: '',
  telephone: '',
  date_naissance: '',
  adresse: '',
  ville: '',
  sexe: 'homme',
};

function toPayload(values: FormValues): StoreStagiairePayload {
  return {
    groupe_id: Number(values.groupe_id),
    diplome_type_id: Number(values.diplome_type_id),
    cef: values.cef,
    nom: values.nom,
    prenom: values.prenom,
    cin: values.cin,
    email: values.email || null,
    telephone: values.telephone || null,
    date_naissance: values.date_naissance || null,
    adresse: values.adresse || null,
    ville: values.ville || null,
    sexe: values.sexe,
  };
}

export default function StagiairesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [groupeFilter, setGroupeFilter] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Stagiaire | null>(null);
  const [deleting, setDeleting] = useState<Stagiaire | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const { register, handleSubmit, reset, setValue, control, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const watchGroupeId = useWatch({ control, name: 'groupe_id' });
  const watchDiplomeTypeId = useWatch({ control, name: 'diplome_type_id' });
  const watchSexe = useWatch({ control, name: 'sexe' });

  const { data, isLoading } = useQuery({
    queryKey: ['stagiaires', page, search, groupeFilter],
    queryFn: () => stagiaireService.list({
      page,
      per_page: 10,
      search: search || undefined,
      groupe_id: groupeFilter || undefined,
    }),
  });

  const { data: groupes } = useQuery({
    queryKey: ['groupes', 'options'],
    queryFn: () => groupeService.list({ per_page: 100 }),
  });

  const { data: diplomes } = useQuery({
    queryKey: ['diplome-types', 'options'],
    queryFn: () => diplomeService.list({ per_page: 100 }),
  });

  const createMutation = useMutation({
    mutationFn: (payload: StoreStagiairePayload) => stagiaireService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stagiaires'] });
      toast.success('Stagiaire cree.');
      closeDialog();
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Impossible de creer le stagiaire.')),
  });

  const updateMutation = useMutation({
    mutationFn: (payload: StoreStagiairePayload) => stagiaireService.update(editing!.id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stagiaires'] });
      toast.success('Stagiaire modifie.');
      closeDialog();
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Impossible de modifier le stagiaire.')),
  });

  const importMutation = useMutation({
    mutationFn: (file: File) => stagiaireService.import(file, setUploadProgress),
    onMutate: () => setUploadProgress(0),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['stagiaires'] });
      toast.success(response.message || 'Import en cours...');
      setImportFile(null);
      setUploadProgress(100);
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Erreur lors de l import.')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => stagiaireService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stagiaires'] });
      toast.success('Stagiaire supprimé.');
      setDeleting(null);
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Impossible de supprimer le stagiaire.')),
  });

  const openCreate = () => {
    setEditing(null);
    reset(defaultValues);
    setOpen(true);
  };

  const openEdit = (stagiaire: Stagiaire) => {
    setEditing(stagiaire);
    reset({
      groupe_id: String(stagiaire.groupe_id),
      diplome_type_id: String(stagiaire.diplome_type_id),
      cef: stagiaire.cef,
      nom: stagiaire.nom,
      prenom: stagiaire.prenom,
      cin: stagiaire.cin,
      email: stagiaire.email ?? '',
      telephone: stagiaire.telephone ?? '',
      date_naissance: stagiaire.date_naissance ?? '',
      adresse: stagiaire.adresse ?? '',
      ville: stagiaire.ville ?? '',
      sexe: stagiaire.sexe,
    });
    setOpen(true);
  };

  const closeDialog = () => {
    setOpen(false);
    setEditing(null);
    reset(defaultValues);
  };

  const closeImport = () => {
    setImportOpen(false);
    setImportFile(null);
    setUploadProgress(0);
    importMutation.reset();
  };

  const onSubmit = (values: FormValues) => {
    const payload = toPayload(values);
    if (editing) updateMutation.mutate(payload);
    else createMutation.mutate(payload);
  };

  const saving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <PageHeader title="Stagiaires" description="Gerer les stagiaires de l&apos;institut" icon={GraduationCap}>
        <Button onClick={() => setImportOpen(true)} variant="outline" className="h-9 rounded-lg border-border/50 px-4 text-[13px] font-medium">
          <Upload className="mr-1.5 h-4 w-4" />
          Importer Excel
        </Button>
        <Button onClick={openCreate} className="h-9 rounded-lg bg-primary px-4 text-[13px] font-medium text-white hover:bg-primary-hover">
          <Plus className="mr-1.5 h-4 w-4" />
          Ajouter
        </Button>
      </PageHeader>

      <div className="flex flex-col gap-3 sm:flex-row">
        <SearchInput value={search} onChange={(value) => { setSearch(value); setPage(1); }} placeholder="Rechercher par CEF, CIN, nom..." className="w-full sm:w-80" />
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
      </div>

      {isLoading ? (
        <TableSkeleton columns={6} />
      ) : !data?.data.length ? (
        <EmptyState title="Aucun stagiaire" description="Ajoutez un premier stagiaire ou lancez un import Excel." icon={GraduationCap}>
          <Button onClick={openCreate} size="sm" className="mt-4 h-9 rounded-lg bg-primary px-4 text-[13px] font-medium text-white hover:bg-primary-hover">
            <Plus className="mr-1.5 h-4 w-4" />
            Ajouter
          </Button>
        </EmptyState>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border/50 bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border/50 hover:bg-transparent">
                <TableHead className="px-5 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground/80">CEF</TableHead>
                <TableHead className="px-5 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground/80">Nom</TableHead>
                <TableHead className="hidden px-5 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground/80 md:table-cell">CIN</TableHead>
                <TableHead className="hidden px-5 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground/80 lg:table-cell">Telephone</TableHead>
                <TableHead className="px-5 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground/80">Groupe</TableHead>
                <TableHead className="text-[11px] font-medium text-muted-foreground/80 uppercase tracking-[0.12em] px-5 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.data.map((stagiaire) => (
                <TableRow key={stagiaire.id} className="border-b border-border/30 transition-colors duration-150 last:border-0 hover:bg-muted/30">
                  <TableCell className="px-5 py-3 font-mono text-[14px] text-muted-foreground">{stagiaire.cef}</TableCell>
                  <TableCell className="px-5 py-3 text-[14px] font-semibold text-foreground">{getStagiaireFullName(stagiaire)}</TableCell>
                  <TableCell className="hidden px-5 py-3 text-[14px] text-muted-foreground md:table-cell">{stagiaire.cin}</TableCell>
                  <TableCell className="hidden px-5 py-3 text-[14px] text-muted-foreground lg:table-cell">{stagiaire.telephone ?? '-'}</TableCell>
                  <TableCell className="px-5 py-3 text-[14px] text-muted-foreground">{stagiaire.groupe?.code ?? '-'}</TableCell>
                  <TableCell className="px-5 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => openEdit(stagiaire)} className="h-8 rounded-lg text-[12px]">
                        <Pencil className="h-3.5 w-3.5" />
                        Modifier
                      </Button>
                      <Button type="button" variant="destructive" size="sm" onClick={() => setDeleting(stagiaire)} className="h-8 rounded-lg text-[12px]">
                        <Trash2 className="h-3.5 w-3.5" />
                        Supprimer
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {data.meta && <div className="border-t border-border/40 bg-muted/30 px-4 py-2.5"><Pagination meta={data.meta} onPageChange={setPage} /></div>}
        </div>
      )}

      <Dialog open={open} onOpenChange={(value) => { if (!value) closeDialog(); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[720px]">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <DialogHeader>
              <DialogTitle>{editing ? 'Modifier le stagiaire' : 'Nouveau stagiaire'}</DialogTitle>
            </DialogHeader>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Groupe</Label>
                <Select value={watchGroupeId} onValueChange={(value) => setValue('groupe_id', value || '')}>
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
                <Label>Type de diplome</Label>
                <Select value={watchDiplomeTypeId} onValueChange={(value) => setValue('diplome_type_id', value || '')}>
                  <SelectTrigger className="h-9 rounded-lg border-border/50 bg-muted/30 text-[14px]">
                    <SelectValue placeholder="Selectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {diplomes?.data.map((diplome) => (
                      <SelectItem key={diplome.id} value={String(diplome.id)}>{diplome.nom}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.diplome_type_id && <p className="text-[12px] text-destructive">{errors.diplome_type_id.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>CEF</Label>
                <Input {...register('cef')} className="h-9 rounded-lg border-border/50 bg-muted/30 text-[14px]" />
                {errors.cef && <p className="text-[12px] text-destructive">{errors.cef.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>CIN</Label>
                <Input {...register('cin')} className="h-9 rounded-lg border-border/50 bg-muted/30 text-[14px]" />
                {errors.cin && <p className="text-[12px] text-destructive">{errors.cin.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Nom</Label>
                <Input {...register('nom')} className="h-9 rounded-lg border-border/50 bg-muted/30 text-[14px]" />
                {errors.nom && <p className="text-[12px] text-destructive">{errors.nom.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Prenom</Label>
                <Input {...register('prenom')} className="h-9 rounded-lg border-border/50 bg-muted/30 text-[14px]" />
                {errors.prenom && <p className="text-[12px] text-destructive">{errors.prenom.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Sexe</Label>
                <Select value={watchSexe} onValueChange={(value) => setValue('sexe', value as FormValues['sexe'])}>
                  <SelectTrigger className="h-9 rounded-lg border-border/50 bg-muted/30 text-[14px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="homme">Homme</SelectItem>
                    <SelectItem value="femme">Femme</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Date de naissance</Label>
                <Input type="date" {...register('date_naissance')} className="h-9 rounded-lg border-border/50 bg-muted/30 text-[14px]" />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" {...register('email')} className="h-9 rounded-lg border-border/50 bg-muted/30 text-[14px]" />
                {errors.email && <p className="text-[12px] text-destructive">{errors.email.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Telephone</Label>
                <Input {...register('telephone')} className="h-9 rounded-lg border-border/50 bg-muted/30 text-[14px]" />
              </div>
              <div className="space-y-2">
                <Label>Ville</Label>
                <Input {...register('ville')} className="h-9 rounded-lg border-border/50 bg-muted/30 text-[14px]" />
              </div>
              <div className="space-y-2">
                <Label>Adresse</Label>
                <Input {...register('adresse')} className="h-9 rounded-lg border-border/50 bg-muted/30 text-[14px]" />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog} disabled={saving} className="rounded-lg">Annuler</Button>
              <Button type="submit" disabled={saving} className="rounded-lg bg-primary text-white hover:bg-primary-hover">
                {saving ? 'Enregistrement...' : editing ? 'Modifier' : 'Creer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={importOpen} onOpenChange={(value) => { if (!value) closeImport(); }}>
        <DialogContent className="sm:max-w-md">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (importFile) importMutation.mutate(importFile);
            }}
            className="space-y-4"
          >
            <DialogHeader>
              <DialogTitle>Importer des stagiaires</DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              <Label>Fichier Excel ou CSV</Label>
              <Input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={(event) => setImportFile(event.target.files?.[0] ?? null)}
                className="h-10 rounded-lg border-border/50 bg-muted/30 text-[14px] file:mr-4 file:rounded-md file:border-0 file:bg-primary/10 file:px-3 file:py-1 file:text-xs file:font-semibold file:text-primary"
              />
              <p className="text-[12px] leading-relaxed text-muted-foreground">
                Le traitement est lance en arriere-plan par Laravel. Le statut affiche reste donc &quot;Import en cours...&quot;.
              </p>
            </div>

            {importMutation.isPending && (
              <div className="space-y-2 rounded-lg border border-border/50 bg-muted/30 p-3">
                <div className="flex items-center justify-between text-[13px] text-muted-foreground">
                  <span>Import en cours...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${uploadProgress}%` }} />
                </div>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeImport} disabled={importMutation.isPending} className="rounded-lg">Fermer</Button>
              <Button type="submit" disabled={!importFile || importMutation.isPending} className="rounded-lg bg-primary text-white hover:bg-primary-hover">
                {importMutation.isPending ? 'Import en cours...' : 'Importer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(value) => { if (!value) setDeleting(null); }}
        onConfirm={() => { if (deleting) deleteMutation.mutate(deleting.id); }}
        title="Supprimer le stagiaire"
        description="Voulez-vous vraiment supprimer ce stagiaire ?\nCette action est irréversible."
        confirmLabel="Supprimer"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
