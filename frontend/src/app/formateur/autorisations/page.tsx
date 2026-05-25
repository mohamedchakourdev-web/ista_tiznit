'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, FileCheck, X } from 'lucide-react';
import { toast } from 'sonner';
import { autorisationService, getApiErrorMessage } from '@/services/api';
import type { AutorisationStatut } from '@/types';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { Pagination } from '@/components/shared/pagination';
import { AutorisationStatusBadge, PeriodBadge, ReadStatusBadge } from '@/components/shared/status-badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { compactDate, getStagiaireFullName } from '@/utils/domain';

export default function FormateurAutorisationsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statutFilter, setStatutFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['formateur', 'autorisations', page, statutFilter],
    queryFn: () => autorisationService.formateurList({
      page,
      per_page: 10,
      statut: statutFilter || undefined,
    }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, statut }: { id: number; statut: Extract<AutorisationStatut, 'validee' | 'refusee'> }) =>
      autorisationService.updateStatus(id, { statut }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['formateur', 'autorisations'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Autorisation mise a jour.');
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Impossible de mettre a jour l autorisation.')),
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Autorisations" description="Autorisations recues du service gestionnaire" icon={FileCheck} />

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
        <div className="space-y-4">
          {[1, 2, 3, 4].map((item) => <Skeleton key={item} className="h-[148px] max-w-3xl rounded-xl" />)}
        </div>
      ) : !data?.data.length ? (
        <EmptyState title="Aucune autorisation" description="Vous n'avez recu aucune autorisation pour le moment." icon={FileCheck} />
      ) : (
        <div className="max-w-3xl space-y-4">
          {data.data.map((autorisation) => (
            <div
              key={autorisation.id}
              className={`rounded-xl border p-5 transition-all ${
                autorisation.is_read ? 'border-border/50 bg-card' : 'border-primary/30 bg-primary/[0.02] shadow-sm'
              }`}
            >
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <p className="text-[15px] font-semibold text-foreground">{getStagiaireFullName(autorisation.absence?.stagiaire)}</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <span className="rounded-md border border-border/30 bg-muted/40 px-2.5 py-1 text-[13px] tabular-nums text-muted-foreground">
                      {compactDate(autorisation.absence?.date_absence)}
                    </span>
                    {autorisation.absence?.periode && <PeriodBadge period={autorisation.absence.periode} />}
                    <span className="font-mono text-[13px] text-muted-foreground">
                      CEF: {autorisation.absence?.stagiaire?.cef ?? '-'}
                    </span>
                  </div>
                </div>
                <AutorisationStatusBadge statut={autorisation.statut} />
              </div>

              {autorisation.motif && (
                <div className="mb-5 rounded-lg border border-border/40 bg-card/80 px-4 py-3">
                  <p className="text-[14px] leading-relaxed text-muted-foreground">{autorisation.motif}</p>
                </div>
              )}

              <div className="flex flex-col gap-3 border-t border-border/30 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <ReadStatusBadge isRead={autorisation.is_read} />
                {autorisation.statut === 'en_attente' && (
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateMutation.mutate({ id: autorisation.id, statut: 'refusee' })}
                      disabled={updateMutation.isPending}
                      className="h-9 rounded-lg border-red-200 text-[13px] font-medium text-red-700 hover:bg-red-50"
                    >
                      <X className="mr-1.5 h-4 w-4" />
                      Refuser
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => updateMutation.mutate({ id: autorisation.id, statut: 'validee' })}
                      disabled={updateMutation.isPending}
                      className="h-9 rounded-lg bg-primary text-[13px] font-medium text-white hover:bg-primary-hover"
                    >
                      <Check className="mr-1.5 h-4 w-4" />
                      Valider
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {data.meta && <Pagination meta={data.meta} onPageChange={setPage} />}
        </div>
      )}
    </div>
  );
}
