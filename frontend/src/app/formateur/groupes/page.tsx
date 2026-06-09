'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, ChevronRight, MessageCircle, Search, Users, CheckSquare } from 'lucide-react';
import { formateurService } from '@/services/api';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { TableSkeleton } from '@/components/shared/loading-skeleton';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getGroupeFiliereName, getStagiaireFullName } from '@/utils/domain';

export default function FormateurGroupesPage() {
  const [selectedGroupe, setSelectedGroupe] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    const groupe = Number(new URLSearchParams(window.location.search).get('groupe'));
    if (groupe > 0) {
      setSelectedGroupe(groupe);
    }
  }, []);

  // Reset search and selection when group changes
  const handleGroupeSelect = (groupeId: number) => {
    setSelectedGroupe(groupeId);
    setSearchQuery('');
    setSelectedIds(new Set());
  };

  const { data: groupes, isLoading: groupesLoading } = useQuery({
    queryKey: ['formateur', 'groupes'],
    queryFn: () => formateurService.groupes({ per_page: 100 }),
  });

  const { data: stagiaires, isLoading: stagiairesLoading } = useQuery({
    queryKey: ['formateur', 'stagiaires', selectedGroupe],
    queryFn: () => formateurService.stagiaires({ per_page: 100, groupe_id: selectedGroupe ?? undefined }),
    enabled: Boolean(selectedGroupe),
  });

  const selectedGroupeName = groupes?.data.find((groupe) => groupe.id === selectedGroupe)?.nom ?? '-';

  // Filter stagiaires based on search query
  const filteredStagiaires = stagiaires?.data.filter((stagiaire) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase().trim();
    const fullName = getStagiaireFullName(stagiaire).toLowerCase();
    const cef = (stagiaire.cef ?? '').toLowerCase();
    const telephone = (stagiaire.telephone ?? '').toLowerCase();
    return fullName.includes(query) || cef.includes(query) || telephone.includes(query);
  });

  // Checkbox helpers
  const toggleOne = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (!filteredStagiaires) return;
    const allFilteredIds = filteredStagiaires.map((s) => s.id);
    const allSelected = allFilteredIds.every((id) => selectedIds.has(id));
    if (allSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        allFilteredIds.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        allFilteredIds.forEach((id) => next.add(id));
        return next;
      });
    }
  };

  const isAllSelected = Boolean(filteredStagiaires?.length) && filteredStagiaires!.every((s) => selectedIds.has(s.id));
  const isSomeSelected = filteredStagiaires?.some((s) => selectedIds.has(s.id)) && !isAllSelected;

  // Share selected students via WhatsApp
  const shareSelected = () => {
    if (!stagiaires?.data || selectedIds.size === 0) return;
    const selected = stagiaires.data.filter((s) => selectedIds.has(s.id));
    const lines = selected.map(
      (s) => `• ${getStagiaireFullName(s)} (CEF: ${s.cef})`
    );
    const message = `ISTA Tiznit - Suivi des absences\nGroupe: ${selectedGroupeName}\n\nStagiaires (${selected.length}):\n${lines.join('\n')}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`, '_blank');
  };

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
              onClick={() => handleGroupeSelect(groupe.id)}
              className={`group flex items-center justify-between rounded-xl border px-4 py-3.5 text-left transition-all ${
                selectedGroupe === groupe.id
                  ? 'border-primary bg-primary/[0.03] ring-1 ring-primary/20'
                  : 'border-border/50 bg-card hover:border-border/70 hover:bg-muted/30'
              }`}
            >
              <div>
                <p className={`text-[13px] font-medium ${selectedGroupe === groupe.id ? 'text-primary' : 'text-foreground'}`}>{groupe.nom}</p>
                <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{getGroupeFiliereName(groupe)}</p>
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

      {Boolean(selectedGroupe) && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="text-sm font-semibold text-foreground shrink-0">Stagiaires du groupe</h2>
            <div className="relative w-full max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
              <Input
                type="text"
                placeholder="Rechercher par nom, CEF..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 rounded-lg border-border/50 bg-muted/30 pl-9 pr-3 text-[13px] placeholder:text-muted-foreground/50 focus-visible:border-primary/40 focus-visible:ring-1 focus-visible:ring-primary/20"
              />
            </div>
          </div>
          {stagiairesLoading ? (
            <TableSkeleton columns={5} rows={4} />
          ) : !filteredStagiaires?.length ? (
            searchQuery.trim() ? (
              <EmptyState title="Aucun résultat" description={`Aucun stagiaire ne correspond à "${searchQuery}"`} icon={Search} />
            ) : (
              <EmptyState title="Aucun stagiaire dans ce groupe" icon={Users} />
            )
          ) : (
            <div className="overflow-hidden rounded-xl border border-border/50 bg-card shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-border/40 hover:bg-transparent">
                    <TableHead className="w-12 px-4">
                      <Checkbox
                        checked={isAllSelected}
                        indeterminate={isSomeSelected}
                        onCheckedChange={toggleAll}
                        className="size-[18px] rounded-[5px] border-[#CBD5E1]"
                      />
                    </TableHead>
                    <TableHead className="px-5 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground/80">CEF</TableHead>
                    <TableHead className="px-5 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground/80">Nom</TableHead>
                    <TableHead className="hidden px-5 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground/80 sm:table-cell">Telephone</TableHead>
                    <TableHead className="hidden px-5 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground/80 lg:table-cell">Diplome</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStagiaires.map((stagiaire) => {
                    const isChecked = selectedIds.has(stagiaire.id);
                    return (
                      <TableRow
                        key={stagiaire.id}
                        className={`border-b border-border/30 transition-colors duration-150 last:border-0 hover:bg-muted/30 ${isChecked ? 'bg-primary/[0.03]' : ''}`}
                        onClick={() => toggleOne(stagiaire.id)}
                        style={{ cursor: 'pointer' }}
                      >
                        <TableCell className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={() => toggleOne(stagiaire.id)}
                            className="size-[18px] rounded-[5px] border-[#CBD5E1]"
                          />
                        </TableCell>
                        <TableCell className="px-5 py-3 font-mono text-[13px] text-muted-foreground">{stagiaire.cef}</TableCell>
                        <TableCell className="px-5 py-3 text-[13px] font-medium text-foreground">{getStagiaireFullName(stagiaire)}</TableCell>
                        <TableCell className="hidden px-5 py-3 text-[13px] text-muted-foreground sm:table-cell">{stagiaire.telephone ?? '-'}</TableCell>
                        <TableCell className="hidden px-5 py-3 text-[13px] text-muted-foreground lg:table-cell">{stagiaire.diplome_type?.nom ?? '-'}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Floating action bar when students are selected */}
          {selectedIds.size > 0 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 sticky bottom-4 mt-4 flex items-center justify-between rounded-xl border border-border/50 bg-card px-5 py-3 shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
              <div className="flex items-center gap-2">
                <CheckSquare className="h-4 w-4 text-primary" />
                <span className="text-[13px] font-medium text-foreground">
                  {selectedIds.size} stagiaire{selectedIds.size > 1 ? 's' : ''} sélectionné{selectedIds.size > 1 ? 's' : ''}
                </span>
                <button
                  onClick={() => setSelectedIds(new Set())}
                  className="ml-1 text-[12px] text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                >
                  Désélectionner
                </button>
              </div>
              <Button
                onClick={shareSelected}
                size="sm"
                className="gap-1.5 rounded-lg border-0 bg-clip-border bg-green-600 px-4 text-[13px] font-medium text-white shadow-sm hover:bg-green-700"
              >
                <MessageCircle className="h-4 w-4" />
                Partager sur WhatsApp
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
