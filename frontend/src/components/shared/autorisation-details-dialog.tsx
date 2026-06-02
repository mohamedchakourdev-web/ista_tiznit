"use client";

import Image from "next/image";
import {
  CalendarCheck,
  CalendarDays,
  ClipboardPenLine,
  Clock3,
  IdCard,
  Presentation,
  UserRound,
  UsersRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { Autorisation, User } from "@/types";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  compactDate,
  getAutorisationStatutLabel,
  getPeriodeLabel,
  getStagiaireFullName,
} from "@/utils/domain";
import {
  getAutorisationCef,
  getAutorisationFormateur,
  getAutorisationGroupe,
  getAutorisationStagiaire,
} from "@/utils/notification-details";

interface AutorisationDetailsDialogProps {
  open: boolean;
  autorisation: Autorisation | null;
  onOpenChange: (open: boolean) => void;
  currentUser?: User | null;
}

// Solid status pills — green = acceptée, red = refusée, amber = en attente.
const statusBadgeTone: Record<Autorisation["statut"], { bg: string; ring: string }> = {
  en_attente: { bg: "#f59e0b", ring: "rgba(245, 158, 11, 0.28)" },
  validee: { bg: "#22c55e", ring: "rgba(34, 197, 94, 0.28)" },
  refusee: { bg: "#ef4444", ring: "rgba(239, 68, 68, 0.28)" },
};

function displayValue(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed || "-";
}

function StatusBadge({ statut, label }: { statut: Autorisation["statut"]; label: string }) {
  const tone = statusBadgeTone[statut];

  return (
    <span
      className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[13px] font-bold uppercase leading-none tracking-[0.08em] text-white"
      style={{ backgroundColor: tone.bg, boxShadow: `0 0 0 4px ${tone.ring}` }}
    >
      <span className="h-2 w-2 rounded-full bg-white/90" aria-hidden="true" />
      {label}
    </span>
  );
}

function ReferenceDivider() {
  return (
    <div className="mx-auto mt-3 flex w-40 items-center justify-center gap-2" aria-hidden="true">
      <span className="h-px flex-1 bg-[#1a2e4a]/35" />
      <span className="grid h-2.5 w-2.5 rotate-45 place-items-center border border-[#1a2e4a] bg-white">
        <span className="block h-1 w-1 bg-[#1a2e4a]" />
      </span>
      <span className="h-px flex-1 bg-[#1a2e4a]/35" />
    </div>
  );
}

function OfpptStamp() {
  return (
    <div
      className="relative grid h-24 w-24 shrink-0 place-items-center rounded-full border-[3px] border-[#3355d4] text-center text-[#3355d4] opacity-[0.85]"
      style={{ transform: "rotate(-8deg)" }}
      aria-hidden="true"
    >
      <span className="absolute inset-[6px] rounded-full border border-dashed border-[#3355d4]/70" />
      <span className="absolute inset-[13px] rounded-full border border-[#3355d4]/40" />
      <span className="flex flex-col items-center justify-center uppercase leading-none">
        <span className="text-[15px] font-black tracking-[0.08em]">OFPPT</span>
        <span className="mt-0.5 text-[10px] font-black tracking-[0.12em]">ISTA</span>
        <span className="text-[9px] font-black tracking-[0.1em]">Tiznit</span>
      </span>
    </div>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value?: string | null;
}) {
  return (
    <div className="grid min-h-[46px] grid-cols-[120px_1fr] items-center gap-3 px-4 py-3 odd:bg-[#fafbfd] sm:grid-cols-[170px_1fr] sm:gap-4 sm:px-5">
      <dt className="flex items-center gap-2 text-[13px] font-bold leading-tight text-[#1a2e4a]">
        <Icon className="h-4 w-4 shrink-0 text-[#1a2e4a]" strokeWidth={2.2} />
        <span>{label}</span>
      </dt>
      <dd className="min-w-0 break-words text-[14px] leading-snug text-slate-700">
        {displayValue(value)}
      </dd>
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
  const statusLabel = getAutorisationStatutLabel(autorisation.statut).toLocaleUpperCase("fr-FR");

  const rows = [
    { icon: UserRound, label: "Stagiaire", value: getStagiaireFullName(stagiaire) },
    { icon: IdCard, label: "CEF", value: getAutorisationCef(autorisation) },
    { icon: UsersRound, label: "Groupe", value: getAutorisationGroupe(autorisation) },
    { icon: Presentation, label: "Formateur", value: getAutorisationFormateur(autorisation, currentUser) },
    { icon: CalendarDays, label: "Date absence", value: compactDate(autorisation.absence?.date_absence) },
    { icon: CalendarCheck, label: "Date création", value: compactDate(autorisation.created_at) },
    { icon: Clock3, label: "Période", value: getPeriodeLabel(autorisation.absence?.periode) },
    { icon: ClipboardPenLine, label: "Motif", value: autorisation.motif?.trim() || "-" },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100vh-2rem)] w-[min(94vw,720px)] gap-0 overflow-y-auto p-0 sm:max-w-none">
        <article className="overflow-hidden rounded-xl bg-white text-[#1a2e4a]">
          {/* Brand accent bar */}
          <div className="h-1.5 w-full bg-[#1a2e4a]" />

          <div className="p-8 sm:p-10">
            {/* Header: logo + institution on the left */}
            <header className="flex items-center gap-4 border-b border-[#e8edf2] pb-5">
              <Image
                src="/ofppt-logo.png"
                alt="Logo officiel OFPPT"
                width={64}
                height={64}
                priority
                className="h-14 w-14 shrink-0 object-contain"
              />
              <div className="leading-tight">
                <p className="text-xl font-extrabold tracking-wide text-[#1a2e4a]">OFPPT</p>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                  ISTA Tiznit
                </p>
              </div>
            </header>

            {/* Centered title — never clipped, scales down gracefully */}
            <div className="mt-6 text-center">
              <DialogTitle className="text-[clamp(22px,5vw,30px)] font-extrabold uppercase leading-tight tracking-[0.06em] text-[#1a2e4a]">
                Autorisation d&apos;Accès
              </DialogTitle>
              <ReferenceDivider />
              <p className="mt-3 text-[13px] font-medium tracking-wide text-slate-500">
                Code : {displayValue(autorisation.code)}
              </p>
            </div>

            {/* Two-column detail table */}
            <dl className="mt-6 divide-y divide-[#e8edf2] overflow-hidden rounded-lg border border-[#e8edf2]">
              {rows.map((row) => (
                <DetailRow key={row.label} icon={row.icon} label={row.label} value={row.value} />
              ))}
            </dl>

            {/* Footer: status badge (left) + official stamp (right) */}
            <footer className="mt-7 flex items-end justify-between gap-4 border-t border-[#e8edf2] pt-6">
              <div className="flex flex-col gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Statut de la demande
                </span>
                <StatusBadge statut={autorisation.statut} label={statusLabel} />
              </div>
              <OfpptStamp />
            </footer>
          </div>
        </article>
      </DialogContent>
    </Dialog>
  );
}
