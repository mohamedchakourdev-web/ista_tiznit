'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { RotateCcw, Trash2, UserX } from 'lucide-react';
import { toast } from 'sonner';
import { directorService, getApiErrorMessage } from '@/services/api';
import type { User } from '@/types';
import { PageHeader } from '@/components/shared/page-header';
import { SearchInput } from '@/components/shared/search-input';
import { Pagination } from '@/components/shared/pagination';
import { EmptyState } from '@/components/shared/empty-state';
import { TableSkeleton } from '@/components/shared/loading-skeleton';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getPrimaryRole, getRoleLabel, getUserFullName } from '@/utils/domain';

function formatDeletedAt(value: string | null | undefined): string {
  if (!value) return '-';

  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export default function DirecteurDeletedUsersPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [restoring, setRestoring] = useState<User | null>(null);
  const [forceDeleting, setForceDeleting] = useState<User | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['director-users-trashed', page, search],
    queryFn: () => directorService.trashedUsers({ page, per_page: 10, search: search || undefined }),
  });

  const restoreMutation = useMutation({
    mutationFn: (id: number) => directorService.restoreUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['director-users-trashed'] });
      queryClient.invalidateQueries({ queryKey: ['director-users'] });
      queryClient.invalidateQueries({ queryKey: ['director-overview'] });
      toast.success('Utilisateur restaure.');
      setRestoring(null);
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Impossible de restaurer l utilisateur.')),
  });

  const forceDeleteMutation = useMutation({
    mutationFn: (id: number) => directorService.forceDeleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['director-users-trashed'] });
      queryClient.invalidateQueries({ queryKey: ['director-overview'] });
      toast.success('Utilisateur supprime definitivement.');
      setForceDeleting(null);
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Impossible de supprimer definitivement l utilisateur.')),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Utilisateurs supprimes"
        description="Comptes desactives pouvant etre restaures ou supprimes definitivement"
        icon={UserX}
      />

      <div className="flex flex-col sm:flex-row gap-3">
        <SearchInput value={search} onChange={(value) => { setSearch(value); setPage(1); }} className="w-full sm:w-80" />
      </div>

      {isLoading ? (
        <TableSkeleton columns={5} />
      ) : !data?.data.length ? (
        <EmptyState title="Aucun utilisateur supprime" description="Aucun compte supprime ne correspond a votre recherche." icon={UserX} />
      ) : (
        <div className="rounded-xl border border-border/50 bg-card shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b border-border/50">
                <TableHead className="text-[11px] font-medium text-muted-foreground/80 uppercase tracking-[0.12em] px-5">Nom</TableHead>
                <TableHead className="text-[11px] font-medium text-muted-foreground/80 uppercase tracking-[0.12em] px-5">Email</TableHead>
                <TableHead className="text-[11px] font-medium text-muted-foreground/80 uppercase tracking-[0.12em] px-5">Roles</TableHead>
                <TableHead className="text-[11px] font-medium text-muted-foreground/80 uppercase tracking-[0.12em] px-5">Supprime le</TableHead>
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
                      {(user.roles?.length ? user.roles : [getPrimaryRole(user)]).filter(Boolean).map((role) => (
                        <Badge key={role} variant="outline" className="rounded-md bg-muted/50 text-[11px]">
                          {getRoleLabel(role!)}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-[14px] text-muted-foreground px-5 py-3">{formatDeletedAt(user.deleted_at)}</TableCell>
                  <TableCell className="px-5 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => setRestoring(user)} className="h-8 rounded-lg text-[12px]">
                        <RotateCcw className="h-3.5 w-3.5" />
                        Restaurer
                      </Button>
                      <Button type="button" variant="destructive" size="sm" onClick={() => setForceDeleting(user)} className="h-8 rounded-lg text-[12px]">
                        <Trash2 className="h-3.5 w-3.5" />
                        Suppression definitive
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

      <ConfirmDialog
        open={!!restoring}
        onOpenChange={(value) => { if (!value) setRestoring(null); }}
        onConfirm={() => { if (restoring) restoreMutation.mutate(restoring.id); }}
        title="Restaurer utilisateur"
        description={restoring ? `Restaurer ${getUserFullName(restoring) || restoring.email} ?` : undefined}
        confirmLabel="Restaurer"
        loading={restoreMutation.isPending}
      />

      <ConfirmDialog
        open={!!forceDeleting}
        onOpenChange={(value) => { if (!value) setForceDeleting(null); }}
        onConfirm={() => { if (forceDeleting) forceDeleteMutation.mutate(forceDeleting.id); }}
        title="Suppression definitive"
        description={forceDeleting ? `Supprimer definitivement ${getUserFullName(forceDeleting) || forceDeleting.email} ? Cette action est irreversible.` : undefined}
        confirmLabel="Supprimer definitivement"
        loading={forceDeleteMutation.isPending}
      />
    </div>
  );
}
