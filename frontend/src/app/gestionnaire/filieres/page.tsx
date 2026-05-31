'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FolderOpen, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { filiereService, getApiErrorMessage } from '@/services/api';
import type { Filiere, StoreFilierePayload } from '@/types';
import { PageHeader } from '@/components/shared/page-header';
import { SearchInput } from '@/components/shared/search-input';
import { Pagination } from '@/components/shared/pagination';
import { EmptyState } from '@/components/shared/empty-state';
import { TableSkeleton } from '@/components/shared/loading-skeleton';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const schema = z.object({
  nom: z.string().min(1, 'Nom requis'),
  code: z.string().min(1, 'Code requis'),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function FilieresPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Filiere | null>(null);
  const [deleting, setDeleting] = useState<Filiere | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { nom: '', code: '', description: '' },
  });

  const { data, isLoading } = useQuery({
    queryKey: ['filieres', page, search],
    queryFn: () => filiereService.list({ page, per_page: 10, search: search || undefined }),
  });

  const createMutation = useMutation({
    mutationFn: (payload: StoreFilierePayload) => filiereService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['filieres'] });
      toast.success('Filière créée.');
      closeDialog();
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Impossible de créer la filière.')),
  });

  const updateMutation = useMutation({
    mutationFn: (payload: StoreFilierePayload) => filiereService.update(editing!.id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['filieres'] });
      toast.success('Filière modifiée.');
      closeDialog();
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Impossible de modifier la filière.')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => filiereService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['filieres'] });
      toast.success('Filière supprimée.');
      setDeleting(null);
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Impossible de supprimer la filière.')),
  });

  const openCreate = () => {
    setEditing(null);
    reset({ nom: '', code: '', description: '' });
    setOpen(true);
  };

  const openEdit = (filiere: Filiere) => {
    setEditing(filiere);
    reset({ nom: filiere.nom, code: filiere.code, description: filiere.description ?? '' });
    setOpen(true);
  };

  const closeDialog = () => {
    setOpen(false);
    setEditing(null);
    reset({ nom: '', code: '', description: '' });
  };

  const onSubmit = (values: FormValues) => {
    const payload = { ...values, description: values.description || null };
    if (editing) updateMutation.mutate(payload);
    else createMutation.mutate(payload);
  };

  const saving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <PageHeader title="Filières" description="Gestion des filières disponibles dans l'établissement" icon={FolderOpen}>
        <Button onClick={openCreate} className="bg-primary hover:bg-primary-hover text-white rounded-lg text-[13px] font-medium h-9 px-4 transition-colors">
          <Plus className="mr-1.5 h-4 w-4" />
          Nouvelle filière
        </Button>
      </PageHeader>

      <div className="flex flex-col sm:flex-row gap-3">
        <SearchInput value={search} onChange={(value) => { setSearch(value); setPage(1); }} className="w-full sm:w-80" />
      </div>

      {isLoading ? (
        <TableSkeleton columns={5} />
      ) : !data?.data.length ? (
        <EmptyState title="Aucune filière" description="Créez une première filière pour organiser les groupes." icon={FolderOpen} />
      ) : (
        <div className="rounded-xl border border-border/50 bg-card shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b border-border/50">
                <TableHead className="text-[11px] font-medium text-muted-foreground/80 uppercase tracking-[0.12em] px-5">Nom</TableHead>
                <TableHead className="text-[11px] font-medium text-muted-foreground/80 uppercase tracking-[0.12em] px-5">Code</TableHead>
                <TableHead className="text-[11px] font-medium text-muted-foreground/80 uppercase tracking-[0.12em] px-5">Description</TableHead>
                <TableHead className="text-[11px] font-medium text-muted-foreground/80 uppercase tracking-[0.12em] px-5">Groupes</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.data.map((filiere) => (
                <TableRow key={filiere.id} className="hover:bg-muted/30 border-b border-border/30 last:border-0 transition-colors duration-150">
                  <TableCell className="text-[14px] font-medium text-foreground px-5 py-3">{filiere.nom}</TableCell>
                  <TableCell className="text-[14px] text-muted-foreground px-5 py-3">{filiere.code}</TableCell>
                  <TableCell className="text-[14px] text-muted-foreground px-5 py-3">{filiere.description ?? '—'}</TableCell>
                  <TableCell className="text-[14px] text-muted-foreground px-5 py-3">{filiere.groupes_count ?? '—'}</TableCell>
                  <TableCell className="px-5 py-3 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger className="inline-flex items-center justify-center h-8 w-8 rounded-lg hover:bg-muted/60 text-muted-foreground/70 hover:text-foreground transition-colors duration-150">
                        <MoreHorizontal className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-36 rounded-lg p-1 border-border/50 shadow-sm">
                        <DropdownMenuItem onClick={() => openEdit(filiere)} className="text-[13px] gap-2">
                          <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setDeleting(filiere)} className="text-[13px] gap-2 text-destructive focus:text-destructive">
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
        <DialogContent className="sm:max-w-[520px]">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <DialogHeader>
              <DialogTitle>{editing ? 'Modifier la filière' : 'Nouvelle filière'}</DialogTitle>
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
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea {...register('description')} className="rounded-lg border-border/50 bg-muted/30 text-[14px] min-h-[90px]" />
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
        title="Supprimer la filière"
        description="Voulez-vous vraiment supprimer cette filière ?"
        confirmLabel="Supprimer"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
