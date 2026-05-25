'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, ChevronRight, MessageCircle, Users } from 'lucide-react';
import { formateurService } from '@/services/api';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { TableSkeleton } from '@/components/shared/loading-skeleton';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getStagiaireFullName } from '@/utils/domain';

export default function FormateurGroupesPage() {
  const groupeIdFromUrl = Number(new URLSearchParams(window.location.search).get('groupe'));

  const [selectedGroupe, setSelectedGroupe] = useState<number>(groupeIdFromUrl || 0);

  const { data: groupes, isLoading: groupesLoading } = useQuery({
    queryKey: ['formateur', 'groupes'],
    queryFn: () => formateurService.groupes({ per_page: 100 }),
  });

  // useEffect removed; state initialized directly from URL param above.

  const { data: stagiaires, isLoading: stagiairesLoading } = useQuery({
    queryKey: ['formateur', 'stagiaires', selectedGroupe],
    queryFn: () => formateurService.stagiaires({ per_page: 100, groupe_id: selectedGroupe ?? undefined }),
    enabled: Boolean(selectedGroupe),
  });

  const selectedGroupeName = groupes?.data.find((groupe) => groupe.id === selectedGroupe)?.nom ?? '-';

  return (
    <div className="space-y-6">
      <PageHeader title="Mes Groupes" description="Groupes assignes et liste des stagiaires" icon={BookOpen} />

      {groupesLoading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((item) => <Skeleton key={item} className="h-20 rounded-xl" />)}
        </div>
      ) : !groupes?.data.length ? (
        <EmptyState title="Aucun groupe" description="Vous n&apos;avez pas encore de groupes assignes." icon={BookOpen} />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {groupes.data.map((groupe) => (
            <button
              key={groupe.id}
              onClick={() => setSelectedGroupe(groupe.id)}
              className={`group flex items-center justify-between rounded-xl border px-4 py-3.5 text-left transition-all ${
                selectedGroupe === groupe.id
                  ? 'border-primary bg-primary/[0.03] ring-1 ring-primary/20'
                  : 'border-border/50 bg-card hover:border-border/70 hover:bg-muted/30'
              }`}
            >
              <div>
                <p className={`text-[13px] font-medium ${selectedGroupe === groupe.id ? 'text-primary' : 'text-foreground'}`}>{groupe.nom}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">{groupe.filiere?.nom}</p>
              </div>
              <div className="flex items-center gap-2.5">
                <Badge variant="outline" className={`gap-1 rounded-md text-[10px] ${selectedGroupe === groupe.id ? 'border-primary/20 bg-primary/10 text-primary' : 'border-border/40 bg-muted/50 text-muted-foreground'}`}>
                  <Users className="h-3 w-3" />
                  {groupe.stagiaires_count ?? 0}
                </Badge>
                <ChevronRight className={`h-4 w-4 transition-colors ${selectedGroupe === groupe.id ? 'text-primary' : 'text-border group-hover:text-muted-foreground'}`} />
              </div>
            </button>
          ))}
        </div>
      )}

      {selectedGroupe && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Stagiaires du groupe</h2>
          </div>
          {stagiairesLoading ? (
            <TableSkeleton columns={5} rows={4} />
          ) : !stagiaires?.data.length ? (
            <EmptyState title="Aucun stagiaire dans ce groupe" icon={Users} />
          ) : (
            <div className="overflow-hidden rounded-xl border border-border/50 bg-card shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-border/40 hover:bg-transparent">
                    <TableHead className="px-5 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground/80">CEF</TableHead>
                    <TableHead className="px-5 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground/80">Nom</TableHead>
                    <TableHead className="hidden px-5 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground/80 sm:table-cell">Telephone</TableHead>
                    <TableHead className="hidden px-5 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground/80 lg:table-cell">Diplome</TableHead>
                    <TableHead className="w-16 px-5" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stagiaires.data.map((stagiaire) => {
                    const shareOnWhatsApp = () => {
                      const message = `ISTA Tiznit - Suivi des absences\nStagiaire: ${getStagiaireFullName(stagiaire)}\nCEF: ${stagiaire.cef}\nGroupe: ${selectedGroupeName}`;
                      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`, '_blank');
                    };

                    return (
                      <TableRow key={stagiaire.id} className="border-b border-border/30 transition-colors duration-150 last:border-0 hover:bg-muted/30">
                        <TableCell className="px-5 py-3 font-mono text-[13px] text-muted-foreground">{stagiaire.cef}</TableCell>
                        <TableCell className="px-5 py-3 text-[13px] font-medium text-foreground">{getStagiaireFullName(stagiaire)}</TableCell>
                        <TableCell className="hidden px-5 py-3 text-[13px] text-muted-foreground sm:table-cell">{stagiaire.telephone ?? '-'}</TableCell>
                        <TableCell className="hidden px-5 py-3 text-[13px] text-muted-foreground lg:table-cell">{stagiaire.diplome_type?.nom ?? '-'}</TableCell>
                        <TableCell className="px-5 py-3 text-right">
                          <Button
                            onClick={shareOnWhatsApp}
                            variant="ghost"
                            size="sm"
                            className="h-8 gap-1.5 rounded-lg px-2 text-[12px] font-medium text-green-600 transition-colors hover:bg-green-50 hover:text-green-700"
                          >
                            <MessageCircle className="h-4 w-4" />
                            <span className="hidden md:inline">Partager</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
