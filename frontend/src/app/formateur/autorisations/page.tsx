'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Eye, FileCheck, X } from 'lucide-react';
import { toast } from 'sonner';
import { autorisationService, getApiErrorMessage } from '@/services/api';
import type { Autorisation, AutorisationStatut, User } from '@/types';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import { PageHeader } from '@/components/shared/page-header';
import { SearchInput } from '@/components/shared/search-input';
import { EmptyState } from '@/components/shared/empty-state';
import { Pagination } from '@/components/shared/pagination';
import { TableSkeleton } from '@/components/shared/loading-skeleton';
import { AutorisationStatusBadge, ReadStatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { compactDate, compactDateTime, getStagiaireFullName, getUserFullName } from '@/utils/domain';

function getAutorisationStagiaire(autorisation: Autorisation) {
  return autorisation.stagiaire ?? autorisation.absence?.stagiaire ?? null;
}

function getAutorisationCef(autorisation: Autorisation): string {
  return getAutorisationStagiaire(autorisation)?.cef ?? '-';
}

function getAutorisationGroupe(autorisation: Autorisation): string {
  return (
    autorisation.stagiaire?.groupe?.nom ??
    autorisation.absence?.groupe?.nom ??
    autorisation.absence?.stagiaire?.groupe?.nom ??
    '-'
  );
}

function getAutorisationDate(autorisation: Autorisation): string {
  return compactDate(autorisation.created_at);
}

function getAutorisationFormateur(autorisation: Autorisation, currentUser?: User | null): string {
  const targetName = getUserFullName(autorisation.target_user);
  if (targetName) return targetName;

  if (currentUser?.id === autorisation.target_user_id) {
    return getUserFullName(currentUser) || currentUser.email;
  }

  return `Formateur #${autorisation.target_user_id}`;
}

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

  const renderDetailsAction = (statut: Extract<AutorisationStatut, 'validee' | 'refusee'>) => {
    if (!selectedAutorisation) return null;

    const isAccept = statut === 'validee';

    return (
      <Button
        type="button"
        size="sm"
        variant={isAccept ? 'default' : 'outline'}
        onClick={() => updateMutation.mutate({ id: selectedAutorisation.id, statut })}
        disabled={updateMutation.isPending}
        className={cn(
          'h-9 rounded-lg text-[13px] font-medium',
          isAccept
            ? 'bg-primary text-white hover:bg-primary-hover'
            : 'border-red-200 text-red-700 hover:bg-red-50',
        )}
      >
        {isAccept ? <Check className="mr-1.5 h-4 w-4" /> : <X className="mr-1.5 h-4 w-4" />}
        {isAccept ? 'Accepter' : 'Refuser'}
      </Button>
    );
  };

  const detailsStagiaire = selectedAutorisation ? getAutorisationStagiaire(selectedAutorisation) : null;

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
            <SelectItem value="validee">Acceptee</SelectItem>
            <SelectItem value="refusee">Refusee</SelectItem>
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
                    <TableCell className="px-5 py-3 text-[14px] tabular-nums text-muted-foreground">{getAutorisationDate(autorisation)}</TableCell>
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
                    <p className="tabular-nums text-muted-foreground">{getAutorisationDate(autorisation)}</p>
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

      <Dialog open={!!selectedAutorisation} onOpenChange={(value) => { if (!value) closeDetails(); }}>
        <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-[720px]">
          {selectedAutorisation && (
            <>
              <DialogHeader className="border-b border-border/40 pb-4">
                <DialogTitle>Details de l&apos;autorisation</DialogTitle>
              </DialogHeader>

              <div className="space-y-5">
                <section className="space-y-3">
                  <h2 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/80">Informations generales</h2>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border border-border/40 bg-muted/20 px-3 py-2.5">
                      <p className="text-[12px] text-muted-foreground">Code autorisation</p>
                      <p className="mt-1 font-mono text-[14px] text-foreground">{selectedAutorisation.code}</p>
                    </div>
                    <div className="rounded-lg border border-border/40 bg-muted/20 px-3 py-2.5">
                      <p className="text-[12px] text-muted-foreground">Date creation</p>
                      <p className="mt-1 text-[14px] tabular-nums text-foreground">{compactDateTime(selectedAutorisation.created_at)}</p>
                    </div>
                    <div className="rounded-lg border border-border/40 bg-muted/20 px-3 py-2.5">
                      <p className="text-[12px] text-muted-foreground">Nom stagiaire</p>
                      <p className="mt-1 text-[14px] font-medium text-foreground">{detailsStagiaire?.nom ?? '-'}</p>
                    </div>
                    <div className="rounded-lg border border-border/40 bg-muted/20 px-3 py-2.5">
                      <p className="text-[12px] text-muted-foreground">Prenom stagiaire</p>
                      <p className="mt-1 text-[14px] font-medium text-foreground">{detailsStagiaire?.prenom ?? '-'}</p>
                    </div>
                    <div className="rounded-lg border border-border/40 bg-muted/20 px-3 py-2.5">
                      <p className="text-[12px] text-muted-foreground">CEF</p>
                      <p className="mt-1 font-mono text-[14px] text-foreground">{getAutorisationCef(selectedAutorisation)}</p>
                    </div>
                    <div className="rounded-lg border border-border/40 bg-muted/20 px-3 py-2.5">
                      <p className="text-[12px] text-muted-foreground">Groupe</p>
                      <p className="mt-1 text-[14px] text-foreground">{getAutorisationGroupe(selectedAutorisation)}</p>
                    </div>
                    <div className="rounded-lg border border-border/40 bg-muted/20 px-3 py-2.5 sm:col-span-2">
                      <p className="text-[12px] text-muted-foreground">Formateur concerne</p>
                      <p className="mt-1 text-[14px] text-foreground">{getAutorisationFormateur(selectedAutorisation, currentUser)}</p>
                    </div>
                    <div className="rounded-lg border border-border/40 bg-muted/20 px-3 py-2.5">
                      <p className="text-[12px] text-muted-foreground">Statut</p>
                      <div className="mt-1"><AutorisationStatusBadge statut={selectedAutorisation.statut} /></div>
                    </div>
                    <div className="rounded-lg border border-border/40 bg-muted/20 px-3 py-2.5">
                      <p className="text-[12px] text-muted-foreground">Lecture</p>
                      <div className="mt-1"><ReadStatusBadge isRead={selectedAutorisation.is_read} /></div>
                    </div>
                  </div>
                </section>

                <section className="space-y-3">
                  <h2 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/80">Motif</h2>
                  <div className="rounded-lg border border-border/50 bg-card px-4 py-3">
                    <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-muted-foreground">
                      {selectedAutorisation.motif || 'Aucun motif renseigne.'}
                    </p>
                  </div>
                </section>
              </div>

              {selectedAutorisation.statut === 'en_attente' && (
                <DialogFooter>
                  {renderDetailsAction('refusee')}
                  {renderDetailsAction('validee')}
                </DialogFooter>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
