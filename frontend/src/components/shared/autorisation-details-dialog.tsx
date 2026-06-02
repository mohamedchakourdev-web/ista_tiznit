'use client';

<<<<<<< ours
import { X } from 'lucide-react';
import Image from 'next/image';
import {
  BadgeCheck,
  CalendarCheck,
  CalendarDays,
  ClipboardPenLine,
  Clock3,
  IdCard,
  Presentation,
  UserRound,
  UsersRound,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
>>>>>>> theirs
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

<<<<<<< ours
const statusTextColor: Record<Autorisation['statut'], string> = {
  en_attente: 'text-amber-800',
  validee: 'text-emerald-800',
  refusee: 'text-red-800',
=======
const statusBadgeTone: Record<Autorisation['statut'], { badge: string; dot: string }> = {
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
>>>>>>> theirs
};

function displayValue(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed || '-';
}

<<<<<<< ours
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
=======
function ReferenceDivider() {
  return (
    <div className="mx-auto mt-[1.7%] flex w-[23%] items-center justify-center gap-[2.5%]" aria-hidden="true">
      <span className="h-px flex-1 bg-[#0b376d]/70" />
      <span className="h-1 w-1 rounded-full bg-[#0b376d]" />
      <span className="grid h-[13px] w-[13px] rotate-45 place-items-center border border-[#0b376d] bg-white">
        <span className="block h-[7px] w-[7px] bg-[#0b376d]" />
      </span>
      <span className="h-1 w-1 rounded-full bg-[#0b376d]" />
      <span className="h-px flex-1 bg-[#0b376d]/70" />
    </div>
  );
}

function StatusBadge({ statut, label }: { statut: Autorisation['statut']; label: string }) {
  const tone = statusBadgeTone[statut];

  return (
    <span
      className={[
        'inline-flex h-[42%] min-h-7 items-center gap-3 rounded-[5px] border px-[2.4%] font-serif text-[clamp(16px,2.3vw,28px)] font-black uppercase leading-none tracking-[0.12em] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.55)]',
        tone.badge,
      ].join(' ')}
    >
      <span className={['h-[0.62em] w-[0.62em] rounded-full', tone.dot].join(' ')} aria-hidden="true" />
      {label}
    </span>
  );
}

function OfpptStamp() {
  return (
    <div
      className="absolute bottom-[2.7%] right-[6.1%] z-20 aspect-square h-[16.7%] rounded-full border-[6px] border-[#3355d4] bg-white/10 text-[#3355d4]"
      style={{ transform: 'rotate(-6deg)' }}
      aria-hidden="true"
    >
      <div className="absolute inset-[8%] rounded-full border border-dashed border-[#3355d4]/80" />
      <div className="absolute inset-[17%] rounded-full border border-[#3355d4]/45" />
      <div className="absolute inset-[24%] rounded-full border border-dashed border-[#3355d4]/55" />
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center font-serif uppercase leading-[0.98]">
        <span className="text-[clamp(18px,2.8vw,32px)] font-black tracking-[0.09em]">OFPPT</span>
        <span className="mt-[3%] text-[clamp(13px,2vw,22px)] font-black tracking-[0.12em]">ISTA</span>
        <span className="text-[clamp(12px,1.8vw,20px)] font-black tracking-[0.1em]">Tiznit</span>
        <span className="mt-[5%] text-[clamp(8px,1.1vw,13px)] font-black tracking-[0.08em]">Autorisation</span>
      </div>
    </div>
  );
}

function TableRow({
  icon: Icon,
  label,
  value,
  isStatus = false,
  statut,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  isStatus?: boolean;
  statut?: Autorisation['statut'];
}) {
  return (
    <div className="grid min-h-0 grid-cols-[28.7%_1fr] border-b border-dotted border-[#d9dfe8] last:border-b-0">
      <div className="grid grid-cols-[22%_1fr] items-center border-r border-[#d1d8e2] bg-[#f7f9fc] px-[7.5%]">
        <Icon className="h-[42%] w-auto text-[#073f7c]" strokeWidth={2.65} />
        <span className="font-serif text-[clamp(14px,2.1vw,27px)] font-black leading-none text-[#071a3d]">
          {label} :
        </span>
      </div>

      <div className="flex min-w-0 items-center px-[4%] font-serif text-[clamp(14px,2.05vw,27px)] leading-none text-black">
        {isStatus && statut ? (
          <StatusBadge statut={statut} label={value} />
        ) : (
          <span className="truncate">{displayValue(value)}</span>
        )}
      </div>
>>>>>>> theirs
    </div>
  );
}

<<<<<<< ours
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
=======
function BottomWave() {
  return (
    <svg
      className="pointer-events-none absolute inset-x-0 bottom-0 h-[10.5%] w-full text-[#d8e0ea]/45"
      viewBox="0 0 1246 130"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {Array.from({ length: 9 }).map((_, index) => (
        <path
          key={index}
          d={`M0 ${94 + index * 4} C250 ${62 + index * 2}, 390 ${76 + index * 3}, 570 ${102 + index * 3} C760 ${130 + index * 2}, 820 ${44 + index * 2}, 1246 ${70 + index * 3}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
        />
      ))}
    </svg>
>>>>>>> theirs
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
<<<<<<< ours
  const motif = autorisation.motif?.trim() || '........................................................';
=======
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
      label: 'Date absence',
      value: compactDate(autorisation.absence?.date_absence),
    },
    {
      icon: CalendarCheck,
      label: 'Date création',
      value: compactDate(autorisation.created_at),
    },
    {
      icon: Clock3,
      label: 'Période',
      value: getPeriodeLabel(autorisation.absence?.periode),
    },
    {
      icon: ClipboardPenLine,
      label: 'Motif',
      value: autorisation.motif?.trim() || '-',
    },
  ];
>>>>>>> theirs

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
<<<<<<< ours
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
=======
        className="aspect-[1246/1230] w-[min(96vw,calc(96vh*1.013),940px)] gap-0 overflow-visible border-0 bg-transparent p-0 text-[#071a3d] shadow-none sm:max-w-none"
      >
        <article className="relative h-full overflow-hidden border-[1.5px] border-[#071a3d] bg-[#fffefd] font-serif shadow-[0_14px_38px_rgba(7,26,61,0.16)]">
          <BottomWave />

          <div className="absolute left-[6.9%] top-[1.7%] z-10 flex w-[13%] flex-col items-center text-center">
            <Image
              src="/ofppt-logo.png"
              alt="Logo officiel OFPPT"
              width={180}
              height={180}
              priority
              className="aspect-square w-full object-contain"
            />
            <p className="mt-[7%] text-[clamp(16px,2.35vw,31px)] font-black uppercase leading-none tracking-[0.23em] text-[#07315f]">
              OFPPT
            </p>
            <p className="mt-[7%] text-[clamp(11px,1.65vw,23px)] font-black uppercase leading-none tracking-[0.18em] text-[#071a3d]">
              ISTA TIZNIT
            </p>
            <span className="mt-[13%] h-px w-full bg-[#b8c0cc]" aria-hidden="true" />
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="absolute right-[4.1%] top-[2.4%] z-30 h-[4.35%] w-[15.6%] rounded-[2px] border border-[#bfc8d2] bg-white/95 p-0 font-serif text-[clamp(12px,1.8vw,23px)] font-black uppercase tracking-[0.12em] text-[#071a3d] shadow-none hover:bg-white"
          >
            <X className="mr-[8%] h-[43%] w-auto" strokeWidth={2.2} />
            Fermer
          </Button>

          <div className="absolute left-[27%] right-[18%] top-[20.8%] z-10 text-center">
            <DialogTitle className="font-serif text-[clamp(26px,4.15vw,52px)] font-black uppercase leading-none tracking-[0.13em] text-[#071a3d]">
              AUTORISATION D&apos;ACCÈS
            </DialogTitle>
            <ReferenceDivider />
            <p className="mt-[2.2%] font-serif text-[clamp(13px,2.15vw,26px)] font-black leading-none tracking-[0.12em] text-[#263047]">
              Code : {autorisation.code}
            </p>
          </div>

          <section className="absolute left-[3.45%] right-[3.7%] top-[33.35%] z-10 h-[54.5%] overflow-hidden rounded-[6px] border border-[#d1d8e2] bg-white">
            <div className="grid h-full grid-rows-[repeat(8,minmax(0,1fr))_minmax(0,1.45fr)]">
              {rows.map((row) => (
                <TableRow key={row.label} icon={row.icon} label={row.label} value={row.value} />
              ))}
              <TableRow
                icon={BadgeCheck}
                label="Statut"
                value={statusLabel}
                isStatus
                statut={autorisation.statut}
              />
            </div>
          </section>

          <OfpptStamp />
>>>>>>> theirs
        </article>
      </DialogContent>
    </Dialog>
  );
}
