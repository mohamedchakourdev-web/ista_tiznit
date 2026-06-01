'use client';

import type { ReactNode } from 'react';
import type { Autorisation, User } from '@/types';
import { AutorisationStatusBadge, ReadStatusBadge } from '@/components/shared/status-badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { compactDateTime } from '@/utils/domain';
import {
  getAutorisationCef,
  getAutorisationFormateur,
  getAutorisationGroupe,
  getAutorisationStagiaire,
} from '@/utils/notification-details';

interface AutorisationDetailsDialogProps {
  open: boolean;
  autorisation: Autorisation | null;
  onOpenChange: (open: boolean) => void;
  currentUser?: User | null;
  footer?: ReactNode;
}

function DetailCard({
  label,
  value,
  valueClassName = 'text-foreground',
}: {
  label: string;
  value: ReactNode;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-lg border border-border/40 bg-muted/20 px-3 py-2.5">
      <p className="text-[12px] text-muted-foreground">{label}</p>
      <div className={`mt-1 text-[14px] ${valueClassName}`}>{value}</div>
    </div>
  );
}

export function AutorisationDetailsDialog({
  open,
  autorisation,
  onOpenChange,
  currentUser,
  footer,
}: AutorisationDetailsDialogProps) {
  const detailsStagiaire = getAutorisationStagiaire(autorisation);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-[720px]">
        {autorisation && (
          <>
            <DialogHeader className="border-b border-border/40 pb-4">
              <DialogTitle>Details de l&apos;autorisation</DialogTitle>
            </DialogHeader>

            <div className="space-y-5">
              <section className="space-y-3">
                <h2 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/80">
                  Informations generales
                </h2>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <DetailCard label="Code autorisation" value={<p className="font-mono text-foreground">{autorisation.code}</p>} />
                  <DetailCard label="Date creation" value={<p className="tabular-nums text-foreground">{compactDateTime(autorisation.created_at)}</p>} />
                  <DetailCard label="Nom stagiaire" value={<p className="font-medium text-foreground">{detailsStagiaire?.nom ?? '-'}</p>} />
                  <DetailCard label="Prenom stagiaire" value={<p className="font-medium text-foreground">{detailsStagiaire?.prenom ?? '-'}</p>} />
                  <DetailCard label="CEF" value={<p className="font-mono text-foreground">{getAutorisationCef(autorisation)}</p>} />
                  <DetailCard label="Groupe" value={<p className="text-foreground">{getAutorisationGroupe(autorisation)}</p>} />
                  <DetailCard
                    label="Formateur concerne"
                    value={<p className="text-foreground">{getAutorisationFormateur(autorisation, currentUser)}</p>}
                    valueClassName="text-foreground"
                  />
                  <DetailCard
                    label="Statut"
                    value={<AutorisationStatusBadge statut={autorisation.statut} />}
                    valueClassName="mt-1"
                  />
                  <DetailCard
                    label="Lecture"
                    value={<ReadStatusBadge isRead={autorisation.is_read} />}
                    valueClassName="mt-1"
                  />
                </div>
              </section>

              <section className="space-y-3">
                <h2 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/80">Motif</h2>
                <div className="rounded-lg border border-border/50 bg-card px-4 py-3">
                  <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-muted-foreground">
                    {autorisation.motif || 'Aucun motif renseigne.'}
                  </p>
                </div>
              </section>
            </div>

            {footer && <DialogFooter>{footer}</DialogFooter>}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
