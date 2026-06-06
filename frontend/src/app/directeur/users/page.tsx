'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Pencil, Plus, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';
import { directorService, getApiErrorMessage } from '@/services/api';
import type { StoreUserPayload, UpdateUserPayload, User, UserRole, FormateurType } from '@/types';
import { PageHeader } from '@/components/shared/page-header';
import { SearchInput } from '@/components/shared/search-input';
import { Pagination } from '@/components/shared/pagination';
import { EmptyState } from '@/components/shared/empty-state';
import { TableSkeleton } from '@/components/shared/loading-skeleton';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getPrimaryRole, getRoleLabel, getUserFullName } from '@/utils/domain';

const USER_ROLES = ['directeur', 'gestionnaire', 'formateur'] as const;
const FORMATEUR_TYPES = ['permanent', 'vacataire'] as const;

const schema = z
  .object({
    nom: z.string().min(1, 'Nom requis'),
    prenom: z.string().optional(),
    email: z.string().min(1, 'Email requis').email('Email invalide'),
    password: z.string().refine((value) => value === '' || value.length >= 8, 'Minimum 8 caracteres'),
    role: z.enum(USER_ROLES),
    type: z.enum(FORMATEUR_TYPES).optional().nullable(),
  })
  .superRefine((val, ctx) => {
    if (val.role === 'formateur' && (val.type === undefined || val.type === null)) {
      ctx.addIssue({ path: ['type'], code: z.ZodIssueCode.custom, message: 'Type formateur requis' });
    }
  });

type FormValues = z.infer<typeof schema>;

const defaultValues: FormValues = {
  nom: '',
  prenom: '',
  email: '',
  password: '',
  role: 'gestionnaire',
  type: undefined,
};

export default function DirecteurUsersPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [deleting, setDeleting] = useState<User | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const watchRole = watch('role');
  const watchType = watch('type');

  const { data, isLoading } = useQuery({
    queryKey: ['director-users', page, search],
    queryFn: () => directorService.users({ page, per_page: 10, search: search || undefined }),
  });

  const createMutation = useMutation({
    mutationFn: (payload: StoreUserPayload) => directorService.createUser(payload),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['director-users'] });
      queryClient.invalidateQueries({ queryKey: ['director-users-trashed'] });
      queryClient.invalidateQueries({ queryKey: ['director-overview'] });
      toast.success(response.message === 'Utilisateur restaure' ? 'Utilisateur restaure.' : 'Utilisateur cree.');
      closeDialog();
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Impossible de creer l utilisateur.')),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateUserPayload }) => directorService.updateUser(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['director-users'] });
      queryClient.invalidateQueries({ queryKey: ['director-overview'] });
      toast.success('Utilisateur modifie.');
      closeDialog();
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Impossible de modifier l utilisateur.')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => directorService.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['director-users'] });
      queryClient.invalidateQueries({ queryKey: ['director-overview'] });
      toast.success('Utilisateur supprime.');
      setDeleting(null);
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Impossible de supprimer l utilisateur.')),
  });

  const openCreate = () => {
    setEditing(null);
    reset(defaultValues);
    setOpen(true);
  };

  const openEdit = (user: User) => {
    setEditing(user);
    reset({
      nom: user.nom,
      prenom: user.prenom ?? '',
      email: user.email,
      password: '',
      role: getPrimaryRole(user) ?? 'gestionnaire',
      type: (user.type ?? undefined) as FormValues['type'],
    });
    setOpen(true);
  };

  const closeDialog = () => {
    setOpen(false);
    setEditing(null);
    reset(defaultValues);
  };

  const onSubmit = (values: FormValues) => {
    const password = values.password.trim();
    const payload = {
      nom: values.nom.trim(),
      prenom: values.prenom?.trim() || null,
      email: values.email.trim(),
      role: values.role as UserRole,
    };

    if (!editing) {
      if (!password) {
        setError('password', { message: 'Mot de passe requis' });
        return;
      }

      const createPayload: StoreUserPayload & { type?: FormateurType | null } = { ...payload, password };
      if (values.role === 'formateur') createPayload.type = values.type ?? null;

      createMutation.mutate(createPayload);
      return;
    }

    const updatePayload: UpdateUserPayload = { ...payload };
    if (password) updatePayload.password = password;

    // Ensure type is sent: required for formateur, null otherwise to clear existing value
    if (values.role === 'formateur') {
      (updatePayload as UpdateUserPayload & { type?: FormateurType | null }).type = values.type ?? null;
    } else {
      (updatePayload as UpdateUserPayload & { type?: FormateurType | null }).type = null;
    }

    updateMutation.mutate({ id: editing.id, payload: updatePayload });
  };

  const saving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <PageHeader title="Utilisateurs" description="Comptes et roles disponibles dans le systeme" icon={Users}>
        <Button onClick={openCreate} className="bg-primary hover:bg-primary-hover text-white rounded-lg text-[13px] font-medium h-9 px-4 transition-colors">
          <Plus className="mr-1.5 h-4 w-4" />
          Ajouter utilisateur
        </Button>
      </PageHeader>

      <div className="flex flex-col sm:flex-row gap-3">
        <SearchInput value={search} onChange={(value) => { setSearch(value); setPage(1); }} className="w-full sm:w-80" />
      </div>

      {isLoading ? (
        <TableSkeleton columns={6} />
      ) : !data?.data.length ? (
        <EmptyState title="Aucun utilisateur" description="Aucun compte ne correspond a votre recherche." icon={Users} />
      ) : (
        <div className="rounded-xl border border-border/50 bg-card shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b border-border/50">
                <TableHead className="text-[11px] font-medium text-muted-foreground/80 uppercase tracking-[0.12em] px-5">Nom</TableHead>
                <TableHead className="text-[11px] font-medium text-muted-foreground/80 uppercase tracking-[0.12em] px-5">Email</TableHead>
                <TableHead className="text-[11px] font-medium text-muted-foreground/80 uppercase tracking-[0.12em] px-5">Roles</TableHead>
                <TableHead className="text-[11px] font-medium text-muted-foreground/80 uppercase tracking-[0.12em] px-5">Type</TableHead>
                <TableHead className="text-[11px] font-medium text-muted-foreground/80 uppercase tracking-[0.12em] px-5">Statut</TableHead>
                <TableHead className="text-[11px] font-medium text-muted-foreground/80 uppercase tracking-[0.12em] px-5 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.data.map((user) => (
                <TableRow key={user.id} className="hover:bg-muted/30 border-b border-border/30 last:border-0 transition-colors duration-150">
                  <TableCell className="text-[14px] font-medium text-foreground px-5 py-3">{getUserFullName(user)}</TableCell>
                  <TableCell className="text-[14px] text-muted-foreground px-5 py-3">{user.email}</TableCell>
                  <TableCell className="px-5 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      {user.roles?.map((role) => (
                        <Badge key={role} variant="outline" className="rounded-md bg-muted/50 text-[11px]">
                          {getRoleLabel(role)}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-[14px] text-muted-foreground px-5 py-3">{user.type ?? '-'}</TableCell>
                  <TableCell className="px-5 py-3">
                    <Badge variant="outline" className={user.is_active ? 'rounded-md bg-emerald-50 text-emerald-700 border-emerald-200/60' : 'rounded-md bg-red-50 text-red-700 border-red-200/60'}>
                      {user.is_active ? 'Actif' : 'Inactif'}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-5 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => openEdit(user)} className="h-8 rounded-lg text-[12px]">
                        <Pencil className="h-3.5 w-3.5" />
                        Modifier
                      </Button>
                      <Button type="button" variant="destructive" size="sm" onClick={() => setDeleting(user)} className="h-8 rounded-lg text-[12px]">
                        <Trash2 className="h-3.5 w-3.5" />
                        Supprimer
                      </Button>
                    </div>
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
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            <DialogHeader>
              <DialogTitle>{editing ? 'Modifier utilisateur' : 'Ajouter utilisateur'}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nom</Label>
                <Input {...register('nom')} className="h-9 rounded-lg border-border/50 bg-muted/30 text-[14px]" />
                {errors.nom && <p className="text-[12px] text-destructive">{errors.nom.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Prenom</Label>
                <Input {...register('prenom')} className="h-9 rounded-lg border-border/50 bg-muted/30 text-[14px]" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" {...register('email')} className="h-9 rounded-lg border-border/50 bg-muted/30 text-[14px]" />
                {errors.email && <p className="text-[12px] text-destructive">{errors.email.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={watchRole} onValueChange={(value) => setValue('role', value as FormValues['role'], { shouldValidate: true })}>
                  <SelectTrigger className="h-9 w-full rounded-lg border-border/50 bg-muted/30 text-[14px]">
                    <SelectValue placeholder="Selectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {USER_ROLES.map((role) => (
                      <SelectItem key={role} value={role}>{getRoleLabel(role)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.role && <p className="text-[12px] text-destructive">{errors.role.message}</p>}
              </div>
            </div>
            {watchRole === 'formateur' && (
              <div className="space-y-2">
                <Label>Type Formateur</Label>
                <Select value={watchType ?? ''} onValueChange={(value) => setValue('type', value as FormValues['type'], { shouldValidate: true })}>
                  <SelectTrigger className="h-9 w-full rounded-lg border-border/50 bg-muted/30 text-[14px]">
                    <SelectValue placeholder="Selectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {FORMATEUR_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{t === 'permanent' ? 'Permanent' : 'Vacataire'}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.type && <p className="text-[12px] text-destructive">{errors.type.message}</p>}
              </div>
            )}
            <div className="space-y-2">
              <Label>Mot de passe</Label>
              <Input type="password" {...register('password')} className="h-9 rounded-lg border-border/50 bg-muted/30 text-[14px]" />
              {errors.password && <p className="text-[12px] text-destructive">{errors.password.message}</p>}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog} disabled={saving} className="rounded-lg">Annuler</Button>
              <Button type="submit" disabled={saving} className="rounded-lg bg-primary hover:bg-primary-hover text-white">
                {saving ? 'Enregistrement...' : editing ? 'Modifier' : 'Creer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(value) => { if (!value) setDeleting(null); }}
        onConfirm={() => { if (deleting) deleteMutation.mutate(deleting.id); }}
        title="Supprimer utilisateur"
        description={deleting ? `Supprimer ${getUserFullName(deleting) || deleting.email} ?` : undefined}
        confirmLabel="Supprimer"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
