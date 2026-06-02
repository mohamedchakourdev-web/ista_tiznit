'use client';

import Image from 'next/image';
import { X } from 'lucide-react';
import {
  BadgeCheck,
  CalendarCheck,
  CalendarDays,
  ClipboardPenLine,
  IdCard,
  Presentation,
  UserRound,
  UsersRound,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Absence, Autorisation, User } from '@/types';
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

const statusTone: Record<Autorisation['statut'], { badge: string; dot: string }> = {
  en_attente: {
    badge: 'border-amber-400/70 bg-amber-50 text-amber-900',
    dot: 'bg-amber-500',
  },
  validee: {
    badge: 'border-emerald-500/60 bg-emerald-50 text-emerald-900',
    dot: 'bg-emerald-600',
  },
  refusee: {
    badge: 'border-red-500/60 bg-red-50 text-red-900',
    dot: 'bg-red-600',
  },
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function getAbsenceDateKey(absence: Absence): string | null {
  const rawDate = absence.date_absence;
  const isoDate = rawDate.match(/^\d{4}-\d{2}-\d{2}/)?.[0];

  if (isoDate) {
    return isoDate;
  }

  const parsedDate = new Date(rawDate);

  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return parsedDate.toISOString().slice(0, 10);
}

function getUtcDay(dateKey: string): number | null {
  const [year, month, day] = dateKey.split('-').map(Number);

  if (!year || !month || !day) {
    return null;
  }

  return Date.UTC(year, month - 1, day) / MS_PER_DAY;
}

function areConsecutiveDates(dateKeys: string[]): boolean {
  const days = dateKeys.map(getUtcDay);

  if (days.some((day) => day === null)) {
    return false;
  }

  return days.every((day, index) => index === 0 || day === Number(days[index - 1]) + 1);
}

function summarizeAbsences(absences: Absence[]): string {
  if (absences.length === 0) {
    return '-';
  }

  if (absences.length === 1) {
    const absence = absences[0];
    return `${compactDate(absence.date_absence)} (${getPeriodeLabel(absence.periode)})`;
  }

  const dateKeys = Array.from(
    new Set(absences.map(getAbsenceDateKey).filter((dateKey): dateKey is string => Boolean(dateKey))),
  ).sort();

  if (dateKeys.length === 0) {
    return absences
      .map((absence) => `${compactDate(absence.date_absence)} (${getPeriodeLabel(absence.periode)})`)
      .join(', ');
  }

  if (dateKeys.length === 1) {
    return `1 jour\n${compactDate(dateKeys[0])}`;
  }

  const countLabel = areConsecutiveDates(dateKeys)
    ? `${dateKeys.length} jours d'absence`
    : `${dateKeys.length} absences`;

  return `${countLabel}\ndu ${compactDate(dateKeys[0])} au ${compactDate(dateKeys[dateKeys.length - 1])}`;
}

function StatusBadge({ statut }: { statut: Autorisation['statut'] }) {
  const tone = statusTone[statut];
  const label = getAutorisationStatutLabel(statut).toLocaleUpperCase('fr-FR');

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-md border px-3 py-1 font-serif text-[13px] font-black uppercase tracking-[0.1em] ${tone.badge}`}
    >
      <span className={`h-2 w-2 rounded-full ${tone.dot}`} />
      {label}
    </span>
  );
}

function DataRow({
  icon: Icon,
  label,
  value,
  isStatus = false,
  statut,
  multiline = false,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  isStatus?: boolean;
  statut?: Autorisation['statut'];
  multiline?: boolean;
}) {
  return (
    <div className="flex border-b border-dotted border-[#d1d8e2] last:border-b-0">
      <div className="flex w-[180px] shrink-0 items-center gap-2.5 bg-[#f4f6fa] px-4 py-3 border-r border-[#d1d8e2]">
        <Icon className="h-4 w-4 shrink-0 text-[#073f7c]" strokeWidth={2.5} />
        <span className="font-serif text-[13px] font-black text-[#071a3d]">
          {label}&nbsp;:
        </span>
      </div>
      <div className="flex min-w-0 flex-1 items-center px-4 py-3 font-serif text-[13px] text-black">
        {isStatus && statut ? (
          <StatusBadge statut={statut} />
        ) : (
          <span className={multiline ? 'whitespace-pre-line break-words' : 'truncate'}>{value || '-'}</span>
        )}
      </div>
    </div>
  );
}

function OfpptStamp() {
  return (
    <div
      className="relative h-[110px] w-[110px] shrink-0 rounded-full border-[4px] border-[#3355d4]/70 text-[#3355d4]/80"
      style={{ transform: 'rotate(-7deg)' }}
      aria-hidden="true"
    >
      <div className="absolute inset-[6%] rounded-full border border-dashed border-[#3355d4]/50" />
      <div className="absolute inset-[16%] rounded-full border border-[#3355d4]/35" />
      <div className="absolute inset-[24%] rounded-full border border-dashed border-[#3355d4]/40" />
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center font-serif uppercase leading-[0.95]">
        <span className="text-[13px] font-black tracking-[0.08em]">OFPPT</span>
        <span className="mt-0.5 text-[9px] font-black tracking-[0.1em]">ISTA</span>
        <span className="text-[9px] font-black tracking-[0.08em]">Tiznit</span>
        <span className="mt-0.5 h-px w-10 bg-[#3355d4]/50" />
        <span className="mt-0.5 text-[7px] font-black tracking-[0.08em]">Autorisation</span>
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

  const absenceList = autorisation.absences && autorisation.absences.length > 0
    ? autorisation.absences
    : autorisation.absence
      ? [autorisation.absence]
      : [];

  const absencesText = summarizeAbsences(absenceList);

  const rows = [
    {
      icon: UserRound,
      label: 'Stagiaire',
      value: getStagiaireFullName(stagiaire),
    },
    {
      icon: IdCard,
      label: 'CEF',
      value: getAutorisationCef(autorisation),
    },
    {
      icon: UsersRound,
      label: 'Groupe',
      value: getAutorisationGroupe(autorisation),
    },
    {
      icon: Presentation,
      label: 'Formateur',
      value: getAutorisationFormateur(autorisation, currentUser),
    },
    {
      icon: CalendarDays,
      label: 'Absence(s)',
      value: absencesText,
      multiline: true,
    },
    {
      icon: CalendarCheck,
      label: 'Date création',
      value: compactDate(autorisation.created_at),
    },
    {
      icon: ClipboardPenLine,
      label: 'Motif',
      value: autorisation.motif?.trim() || '-',
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-h-[calc(100vh-2rem)] w-[min(720px,calc(100vw-2rem))] overflow-y-auto border-0 bg-transparent p-0 shadow-none sm:max-w-[720px]"
      >
        {/* ── Certificate document ── */}
        <article className="relative border-[1.5px] border-[#071a3d] bg-[#fffefd] font-serif shadow-[0_14px_38px_rgba(7,26,61,0.16)]">

          {/* ── Top wave ── */}
          <svg
            className="pointer-events-none h-4 w-full text-[#d8e0ea]/40"
            viewBox="0 0 1246 40"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <path
                key={i}
                d={`M0 ${20 + i * 4} C250 ${12 + i * 2}, 500 ${28 + i * 2}, 750 ${18 + i * 3} C1000 ${8 + i}, 1100 ${24 + i * 2}, 1246 ${16 + i * 3}`}
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
              />
            ))}
          </svg>

          {/* ── Header ── */}
          <div className="flex items-start justify-between px-6 pt-4 sm:px-8 sm:pt-5">
            {/* Logo + Institution */}
            <div className="flex items-center gap-3.5">
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl">
                <Image
                  src="/ofppt-logo.png"
                  alt="Logo OFPPT"
                  fill
                  sizes="56px"
                  className="object-contain bg-white"
                />
              </div>
              <div>
                <p className="text-[18px] font-black uppercase leading-none tracking-[0.14em] text-[#07315f] sm:text-[22px]">
                  OFPPT
                </p>
                <p className="mt-1 text-[11px] font-black uppercase leading-none tracking-[0.16em] text-[#071a3d] sm:text-[13px]">
                  ISTA TIZNIT
                </p>
              </div>
            </div>

            {/* Close */}
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-8 gap-1 rounded-none border-[#bfc8d2] bg-white px-3 font-sans text-[11px] font-semibold uppercase tracking-[0.1em] text-[#071a3d] shadow-none hover:bg-slate-50"
            >
              <X className="h-3.5 w-3.5" strokeWidth={2.2} />
              Fermer
            </Button>
          </div>

          <div className="mt-2 px-6 sm:px-8">
            <span className="block h-px bg-[#b8c0cc]" />
          </div>

          {/* ── Title ── */}
          <div className="mt-4 text-center">
            <DialogTitle className="font-serif text-[22px] font-black uppercase leading-none tracking-[0.1em] text-[#071a3d] sm:text-[28px]">
              AUTORISATION D&apos;ACCÈS
            </DialogTitle>

            {/* Decorative divider */}
            <div className="mx-auto mt-2.5 flex w-[180px] items-center justify-center gap-1.5">
              <span className="h-px flex-1 bg-[#0b376d]/60" />
              <span className="h-1.5 w-1.5 rounded-full bg-[#0b376d]" />
              <span className="grid h-[14px] w-[14px] rotate-45 place-items-center border border-[#0b376d] bg-white">
                <span className="block h-[7px] w-[7px] bg-[#0b376d]" />
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-[#0b376d]" />
              <span className="h-px flex-1 bg-[#0b376d]/60" />
            </div>

            <p className="mt-2 font-serif text-[13px] font-black tracking-[0.1em] text-[#263047]">
              Code : {autorisation.code}
            </p>
          </div>

          {/* ── Data table ── */}
          <div className="mx-5 mt-5 overflow-hidden rounded-md border border-[#d1d8e2] sm:mx-8">
            {rows.map((row) => (
              <DataRow
                key={row.label}
                icon={row.icon}
                label={row.label}
                value={row.value}
                multiline={'multiline' in row ? row.multiline : false}
              />
            ))}
            <DataRow
              icon={BadgeCheck}
              label="Statut"
              value=""
              isStatus
              statut={autorisation.statut}
            />
          </div>

          {/* ── Stamp row ── */}
          <div className="flex justify-end px-6 pb-4 pt-3 sm:px-8 sm:pb-5 sm:pt-4">
            <OfpptStamp />
          </div>

          {/* ── Bottom wave ── */}
          <svg
            className="pointer-events-none h-5 w-full text-[#d8e0ea]/35"
            viewBox="0 0 1246 60"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            {Array.from({ length: 7 }).map((_, i) => (
              <path
                key={i}
                d={`M0 ${30 + i * 5} C200 ${20 + i * 3}, 400 ${38 + i * 2}, 600 ${28 + i * 3} C800 ${18 + i}, 900 ${34 + i * 2}, 1246 ${24 + i * 3}`}
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
              />
            ))}
          </svg>
        </article>
      </DialogContent>
    </Dialog>
  );
}
