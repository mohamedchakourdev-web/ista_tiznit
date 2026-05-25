'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users } from 'lucide-react';
import { directorService } from '@/services/api';
import { PageHeader } from '@/components/shared/page-header';
import { SearchInput } from '@/components/shared/search-input';
import { Pagination } from '@/components/shared/pagination';
import { EmptyState } from '@/components/shared/empty-state';
import { TableSkeleton } from '@/components/shared/loading-skeleton';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getRoleLabel, getUserFullName } from '@/utils/domain';

export default function DirecteurUsersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['director-users', page, search],
    queryFn: () => directorService.users({ page, per_page: 10, search: search || undefined }),
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Utilisateurs" description="Comptes et rôles disponibles dans le système" icon={Users} />

      <div className="flex flex-col sm:flex-row gap-3">
        <SearchInput value={search} onChange={(value) => { setSearch(value); setPage(1); }} className="w-full sm:w-80" />
      </div>

      {isLoading ? (
        <TableSkeleton columns={5} />
      ) : !data?.data.length ? (
        <EmptyState title="Aucun utilisateur" description="Aucun compte ne correspond à votre recherche." icon={Users} />
      ) : (
        <div className="rounded-xl border border-border/50 bg-card shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b border-border/50">
                <TableHead className="text-[11px] font-medium text-muted-foreground/80 uppercase tracking-[0.12em] px-5">Nom</TableHead>
                <TableHead className="text-[11px] font-medium text-muted-foreground/80 uppercase tracking-[0.12em] px-5">Email</TableHead>
                <TableHead className="text-[11px] font-medium text-muted-foreground/80 uppercase tracking-[0.12em] px-5">Rôles</TableHead>
                <TableHead className="text-[11px] font-medium text-muted-foreground/80 uppercase tracking-[0.12em] px-5">Type</TableHead>
                <TableHead className="text-[11px] font-medium text-muted-foreground/80 uppercase tracking-[0.12em] px-5">Statut</TableHead>
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
                  <TableCell className="text-[14px] text-muted-foreground px-5 py-3">{user.type ?? '—'}</TableCell>
                  <TableCell className="px-5 py-3">
                    <Badge variant="outline" className={user.is_active ? 'rounded-md bg-emerald-50 text-emerald-700 border-emerald-200/60' : 'rounded-md bg-red-50 text-red-700 border-red-200/60'}>
                      {user.is_active ? 'Actif' : 'Inactif'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {data.meta && <div className="border-t border-border/40 px-4 py-2.5 bg-muted/30"><Pagination meta={data.meta} onPageChange={setPage} /></div>}
        </div>
      )}
    </div>
  );
}
