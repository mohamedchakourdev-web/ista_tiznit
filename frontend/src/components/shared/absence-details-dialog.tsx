'use client';

import type { ReactNode } from 'react';
import type { Absence } from '@/types';
import { AbsenceTypeBadge, PeriodBadge } from '@/components/shared/status-badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { compactDate, getStagiaireFullName } from '@/utils/domain';
import {
  getAbsenceCef,
  getAbsenceGroupe,
  getAbsenceMotif,
  getAbsenceStagiaire,
} from '@/utils/notification-details';

interface AbsenceDetailsDialogProps {
  open: boolean;
  absence: Absence | null;
  onOpenChange: (open: boolean) => void;
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

export function AbsenceDetailsDialog({ open, absence, onOpenChange }: AbsenceDetailsDialogProps) {
  const detailsStagiaire = getAbsenceStagiaire(absence);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-[640px]">
        {absence && (
          <>
            <DialogHeader className="border-b border-border/40 pb-4">
              <DialogTitle>Details de l&apos;absence</DialogTitle>
            </DialogHeader>

            <div className="space-y-5">
              <section className="space-y-3">
                <h2 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/80">
                  Informations generales
                </h2>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <DetailCard label="Stagiaire" value={<p className="font-medium text-foreground">{getStagiaireFullName(detailsStagiaire)}</p>} />
                  <DetailCard label="CEF" value={<p className="font-mono text-foreground">{getAbsenceCef(absence)}</p>} />
                  <DetailCard label="Groupe" value={<p className="text-foreground">{getAbsenceGroupe(absence)}</p>} />
                  <DetailCard label="Date" value={<p className="tabular-nums text-foreground">{compactDate(absence.date_absence)}</p>} />
                  <DetailCard
                    label="Periode"
                    value={<PeriodBadge period={absence.periode} />}
                    valueClassName="mt-1"
                  />
                  <DetailCard
                    label="Type"
                    value={<AbsenceTypeBadge type={absence.type} />}
                    valueClassName="mt-1"
                  />
                </div>
              </section>

              <section className="space-y-3">
                <h2 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/80">Motif</h2>
                <div className="rounded-lg border border-border/50 bg-card px-4 py-3">
                  <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-muted-foreground">
                    {getAbsenceMotif(absence)}
                  </p>
                </div>
              </section>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
