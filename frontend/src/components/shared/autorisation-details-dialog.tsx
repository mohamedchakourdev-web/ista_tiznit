'use client';

import { X } from 'lucide-react';
import type { Autorisation, User } from '@/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import {
  compactDate,
  getAutorisationStatutLabel,
  getPeriodeLabel,
  getStagiaireFullName,
} from '@/utils/domain';
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
}

const statusTextColor: Record<Autorisation['statut'], string> = {
  en_attente: 'text-amber-800',
  validee: 'text-emerald-800',
  refusee: 'text-red-800',
};

function displayValue(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed || '-';
}

function AdministrativeLine({
  label,
  value,
  mono = false,
  multiline = false,
  valueClassName = '',
}: {
  label: string;
  value: string;
  mono?: boolean;
  multiline?: boolean;
  valueClassName?: string;
}) {
  const fieldValue = displayValue(value);

  return (
    <div className="grid grid-cols-[118px_minmax(0,1fr)] gap-3 py-1.5 text-[14px] leading-6 sm:grid-cols-[148px_minmax(0,1fr)]">
      <dt className="font-semibold text-slate-950">{label} :</dt>
      <dd
        className={[
          'min-w-0 border-b border-dotted border-slate-400/70 pb-0.5 text-slate-950',
          mono ? 'font-mono text-[13px]' : '',
          multiline ? 'min-h-[72px] whitespace-pre-wrap leading-6' : 'truncate',
          valueClassName,
        ].join(' ')}
      >
        {fieldValue}
      </dd>
    </div>
  );
}

function OfpptStamp() {
  return (
    <div
      className="relative h-28 w-28 shrink-0 rounded-full border-[3px] border-blue-800/80 text-blue-900/85 opacity-90"
      style={{ transform: 'rotate(-8deg)' }}
      aria-hidden="true"
    >
      <div className="absolute inset-2 rounded-full border border-dashed border-blue-800/60" />
      <div className="absolute inset-[18px] rounded-full border border-blue-800/30" />
      <div className="absolute inset-0 flex flex-col items-center justify-center px-3 text-center font-serif uppercase leading-tight">
        <span className="text-[15px] font-black tracking-[0.12em]">OFPPT</span>
        <span className="mt-1 text-[8px] font-bold tracking-[0.18em]">ISTA</span>
        <span className="text-[8px] font-bold tracking-[0.16em]">Tiznit</span>
        <span className="mt-1 h-px w-12 bg-blue-800/50" />
        <span className="mt-1 text-[7px] font-bold tracking-[0.14em]">Autorisation</span>
      </div>
    </div>
  );
}

export function AutorisationDetailsDialog({
  open,
  autorisation,
  onOpenChange,
  currentUser,
}: AutorisationDetailsDialogProps) {
  const isOpen = open && Boolean(autorisation);

  if (!autorisation) {
    return null;
  }

  const stagiaire = getAutorisationStagiaire(autorisation);
  const statusLabel = getAutorisationStatutLabel(autorisation.statut).toLocaleUpperCase('fr-FR');
  const motif = autorisation.motif?.trim() || '........................................................';

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-[min(640px,calc(100vw-1rem))] max-h-[calc(100vh-1rem)] overflow-y-auto border-0 bg-transparent p-0 text-slate-950 shadow-none sm:max-w-[640px]"
      >
        <article className="border border-slate-950/70 bg-white font-serif shadow-[0_18px_50px_rgba(15,23,42,0.16)]">
          <header className="border-b border-slate-950/70 px-5 py-4 sm:px-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[21px] font-black uppercase tracking-[0.14em] text-[#0072a6]">
                  OFPPT
                </p>
                <p className="mt-0.5 text-[12px] font-bold uppercase tracking-[0.18em] text-slate-900">
                  ISTA TIZNIT
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="h-8 rounded-none border-slate-500 bg-white px-2.5 font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-800 shadow-none hover:bg-slate-50"
              >
                <X className="mr-1 h-3.5 w-3.5" />
                Fermer
              </Button>
            </div>

            <div className="mt-6 text-center">
              <DialogTitle className="font-serif text-[18px] font-black uppercase tracking-[0.18em] text-slate-950">
                AUTORISATION D&apos;ACCÈS
              </DialogTitle>
              <p className="mt-2 font-mono text-[12px] tracking-[0.08em] text-slate-800">
                Code : {autorisation.code}
              </p>
            </div>
          </header>

          <section className="px-5 py-5 sm:px-7">
            <dl>
              <AdministrativeLine
                label="Stagiaire"
                value={getStagiaireFullName(stagiaire)}
              />
              <AdministrativeLine label="CEF" value={getAutorisationCef(autorisation)} mono />
              <AdministrativeLine label="Groupe" value={getAutorisationGroupe(autorisation)} />
              <AdministrativeLine
                label="Formateur"
                value={getAutorisationFormateur(autorisation, currentUser)}
              />

              <div className="h-4" aria-hidden="true" />

              <AdministrativeLine
                label="Date absence"
                value={compactDate(autorisation.absence?.date_absence)}
              />
              <AdministrativeLine
                label="Date création"
                value={compactDate(autorisation.created_at)}
              />
              <AdministrativeLine
                label="Période"
                value={getPeriodeLabel(autorisation.absence?.periode)}
              />

              <div className="h-4" aria-hidden="true" />

              <AdministrativeLine label="Motif" value={motif} multiline />

              <div className="h-4" aria-hidden="true" />

              <AdministrativeLine
                label="Statut"
                value={statusLabel}
                valueClassName={`font-black uppercase tracking-[0.14em] ${statusTextColor[autorisation.statut]}`}
              />
            </dl>

            <div className="mt-4 flex justify-end">
              <OfpptStamp />
            </div>
          </section>
        </article>
      </DialogContent>
    </Dialog>
  );
}
