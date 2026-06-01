'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Eye, FileCheck, X } from 'lucide-react';
import { toast } from 'sonner';
import { autorisationService, getApiErrorMessage } from '@/services/api';
import type { Autorisation, AutorisationStatut } from '@/types';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import { PageHeader } from '@/components/shared/page-header';
import { SearchInput } from '@/components/shared/search-input';
import { EmptyState } from '@/components/shared/empty-state';
import { Pagination } from '@/components/shared/pagination';
import { TableSkeleton } from '@/components/shared/loading-skeleton';
import { AutorisationStatusBadge, ReadStatusBadge } from '@/components/shared/status-badge';
import { AutorisationDetailsDialog } from '@/components/shared/autorisation-details-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { compactDate, getStagiaireFullName } from '@/utils/domain';
import {
  getAutorisationCef,
  getAutorisationGroupe,
  getAutorisationStagiaire,
} from '@/utils/notification-details';

export default function FormateurAutorisationsPage() {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statutFilter, setStatutFilter] = useState('');
  const [selectedAutorisation, setSelectedAutorisation] = useState<Autorisation | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['formateur', 'autorisations', page, search, statutFilter],
    queryFn: () => autorisationService.formateurList({
      page,
      per_page: 10,
      search: search || undefined,
      statut: statutFilter || undefined,
    }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, statut }: { id: number; statut: Extract<AutorisationStatut, 'validee' | 'refusee'> }) =>
      autorisationService.updateStatus(id, { statut }),
    onSuccess: (response) => {
      setSelectedAutorisation(response.data);
      queryClient.invalidateQueries({ queryKey: ['formateur', 'autorisations'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Autorisation mise a jour.');
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Impossible de mettre a jour l autorisation.')),
  });

  const openDetails = (autorisation: Autorisation) => {
    setSelectedAutorisation(autorisation);
  };

  const closeDetails = () => {
    setSelectedAutorisation(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Autorisations" description="Autorisations recues du service gestionnaire" icon={FileCheck} />

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <SearchInput
          value={search}
          onChange={(value) => { setSearch(value); setPage(1); }}
          placeholder="Rechercher nom, prenom, CEF..."
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
        <EmptyState title="Aucune autorisation" description="Vous n'avez recu aucune autorisation pour le moment." icon={FileCheck} />
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-xl border border-border/50 bg-card shadow-sm md:block">
            <Table className="min-w-[1040px]">
              <TableHeader>
                <TableRow className="border-b border-border/50 hover:bg-transparent">
                  <TableHead className="px-5">Code</TableHead>
                  <TableHead className="px-5">Stagiaire</TableHead>
                  <TableHead className="px-5">CEF</TableHead>
                  <TableHead className="px-5">Groupe</TableHead>
                  <TableHead className="px-5">Statut</TableHead>
                  <TableHead className="px-5">Lecture</TableHead>
                  <TableHead className="px-5">Date</TableHead>
                  <TableHead className="w-16 px-5 text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.data.map((autorisation) => (
                  <TableRow key={autorisation.id} className="border-b border-border/30 transition-colors duration-150 last:border-0 hover:bg-muted/30">
                    <TableCell className="px-5 py-3 font-mono text-[13px] text-muted-foreground">{autorisation.code}</TableCell>
                    <TableCell className="px-5 py-3 text-[14px] font-medium text-foreground">
                      {getStagiaireFullName(getAutorisationStagiaire(autorisation))}
                    </TableCell>
                    <TableCell className="px-5 py-3 font-mono text-[13px] text-muted-foreground">{getAutorisationCef(autorisation)}</TableCell>
                    <TableCell className="px-5 py-3 text-[14px] text-muted-foreground">{getAutorisationGroupe(autorisation)}</TableCell>
                    <TableCell className="px-5 py-3"><AutorisationStatusBadge statut={autorisation.statut} /></TableCell>
                    <TableCell className="px-5 py-3"><ReadStatusBadge isRead={autorisation.is_read} /></TableCell>
                    <TableCell className="px-5 py-3 text-[14px] tabular-nums text-muted-foreground">{compactDate(autorisation.created_at)}</TableCell>
                    <TableCell className="px-5 py-3 text-right">
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="ghost"
                        title="Voir les details"
                        aria-label={`Voir les details de ${autorisation.code}`}
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

          <div className="grid gap-3 md:hidden">
            {data.data.map((autorisation) => (
              <Card
                key={autorisation.id}
                size="sm"
                className={cn(
                  'rounded-lg py-3',
                  autorisation.is_read ? 'ring-foreground/10' : 'bg-primary/[0.02] ring-primary/30',
                )}
              >
                <CardHeader className="gap-2">
                  <CardTitle className="min-w-0">
                    <span className="block truncate text-[14px] font-semibold text-foreground">
                      {getStagiaireFullName(getAutorisationStagiaire(autorisation))}
                    </span>
                  </CardTitle>
                  <CardDescription className="font-mono text-[12px]">{autorisation.code}</CardDescription>
                  <CardAction>
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      title="Voir les details"
                      aria-label={`Voir les details de ${autorisation.code}`}
                      onClick={() => openDetails(autorisation)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </CardAction>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-3 text-[13px]">
                  <div className="min-w-0">
                    <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground/80">CEF</p>
                    <p className="truncate font-mono text-muted-foreground">{getAutorisationCef(autorisation)}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground/80">Groupe</p>
                    <p className="truncate text-muted-foreground">{getAutorisationGroupe(autorisation)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground/80">Date</p>
                    <p className="tabular-nums text-muted-foreground">{compactDate(autorisation.created_at)}</p>
                  </div>
                  <div className="flex items-end justify-end">
                    <AutorisationStatusBadge statut={autorisation.statut} />
                  </div>
                </CardContent>
                <CardFooter className="justify-between bg-muted/30">
                  <ReadStatusBadge isRead={autorisation.is_read} />
                  <span className="text-[12px] text-muted-foreground">Details</span>
                </CardFooter>
              </Card>
            ))}
            {data.meta && <Pagination meta={data.meta} onPageChange={setPage} />}
          </div>
        </>
      )}

      <AutorisationDetailsDialog
        open={!!selectedAutorisation}
        autorisation={selectedAutorisation}
        onOpenChange={(value) => { if (!value) closeDetails(); }}
        currentUser={currentUser}
        onAction={(statut) => {
          if (selectedAutorisation) {
            updateMutation.mutate({ id: selectedAutorisation.id, statut });
          }
        }}
        isActionPending={updateMutation.isPending}
      />
    </div>
  );
}
