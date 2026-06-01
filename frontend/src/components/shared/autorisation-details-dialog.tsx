'use client';

import { useEffect, useState } from 'react';
import type { Autorisation, User } from '@/types';
import Image from 'next/image';
import QRCode from 'qrcode';
import { FileDown, FileText, CalendarDays, Clock3, Loader2, QrCode, X } from 'lucide-react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { AutorisationStatusBadge } from '@/components/shared/status-badge';
import { cn } from '@/lib/utils';
import {
  compactDate,
  compactDateTime,
  getAutorisationStatutLabel,
  getInitials,
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

type StatusTone = {
  shell: string;
  dot: string;
  accentColor: string;
  printAccent: string;
  printSoft: string;
  printDark: string;
};

const statusToneMap: Record<Autorisation['statut'], StatusTone> = {
  en_attente: {
    shell: 'border-amber-200/70 bg-amber-50/70',
    dot: 'bg-amber-500',
    accentColor: '#d97706',
    printAccent: '#d97706',
    printSoft: '#fffbeb',
    printDark: '#92400e',
  },
  validee: {
    shell: 'border-emerald-200/70 bg-emerald-50/70',
    dot: 'bg-emerald-500',
    accentColor: '#059669',
    printAccent: '#059669',
    printSoft: '#ecfdf5',
    printDark: '#065f46',
  },
  refusee: {
    shell: 'border-rose-200/70 bg-rose-50/70',
    dot: 'bg-rose-500',
    accentColor: '#dc2626',
    printAccent: '#dc2626',
    printSoft: '#fef2f2',
    printDark: '#991b1b',
  },
};

function resolveMediaUrl(value?: string | null) {
  const trimmed = value?.trim();
  if (!trimmed) return null;

  if (/^(https?:|data:|blob:)/.test(trimmed) || trimmed.startsWith('/')) {
    return trimmed;
  }

  return `/storage/${trimmed}`;
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function buildQrPayload(autorisation: Autorisation, currentUser?: User | null) {
  const stagiaire = getAutorisationStagiaire(autorisation);
  const statusLabel = getAutorisationStatutLabel(autorisation.statut);
  const payloadParts = [
    'OFPPT-AUTORISATION',
    `id=${autorisation.id}`,
    `code=${autorisation.code}`,
    `statut=${autorisation.statut}`,
    `statut_label=${statusLabel}`,
    `stagiaire=${getStagiaireFullName(stagiaire)}`,
    `cef=${getAutorisationCef(autorisation)}`,
    `groupe=${getAutorisationGroupe(autorisation)}`,
    `formateur=${getAutorisationFormateur(autorisation, currentUser)}`,
    `date_absence=${compactDate(autorisation.absence?.date_absence)}`,
    `created_at=${compactDateTime(autorisation.created_at)}`,
  ];

  return payloadParts.join(';');
}

function buildPrintHtml({
  autorisation,
  currentUser,
  qrDataUrl,
}: {
  autorisation: Autorisation;
  currentUser?: User | null;
  qrDataUrl: string;
}) {
  const tone = statusToneMap[autorisation.statut];
  const stagiaire = getAutorisationStagiaire(autorisation);
  const stagiaireName = getStagiaireFullName(stagiaire);
  const photoUrl = resolveMediaUrl(stagiaire?.photo);
  const cef = getAutorisationCef(autorisation);
  const groupe = getAutorisationGroupe(autorisation);
  const formateur = getAutorisationFormateur(autorisation, currentUser);
  const statusLabel = getAutorisationStatutLabel(autorisation.statut);
  const dateAbsence = compactDate(autorisation.absence?.date_absence);
  const period = getPeriodeLabel(autorisation.absence?.periode);
  const createdAt = compactDateTime(autorisation.created_at);
  const motif = autorisation.motif?.trim() || 'Aucun motif renseigne.';

  return `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Autorisation ${escapeHtml(autorisation.code)}</title>
    <style>
      @page {
        size: A4 landscape;
        margin: 12mm;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        background: #ffffff;
        color: #0f172a;
        font-family: "Segoe UI", Inter, Arial, sans-serif;
      }

      .sheet {
        border: 1px solid #dbe2ea;
        border-radius: 22px;
        overflow: hidden;
        background: #ffffff;
      }

      .header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 18px;
        padding: 18px 22px;
        background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.96));
        border-bottom: 1px solid #e2e8f0;
      }

      .header-left {
        display: flex;
        align-items: center;
        gap: 14px;
        min-width: 0;
      }

      .header-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 42px;
        height: 42px;
        border-radius: 16px;
        background: linear-gradient(135deg, #0f172a, #1e293b);
        color: #ffffff;
        flex: 0 0 auto;
      }

      .header-text {
        min-width: 0;
      }

      .kicker {
        margin: 0;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        color: #64748b;
      }

      .title {
        margin: 4px 0 0;
        font-size: 23px;
        line-height: 1.1;
        font-weight: 700;
        color: #0f172a;
      }

      .code {
        margin: 4px 0 0;
        font-size: 12px;
        font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
        color: #64748b;
        letter-spacing: 0.06em;
      }

      .header-right {
        display: flex;
        align-items: center;
        gap: 10px;
        flex: 0 0 auto;
      }

      .status-pill {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        padding: 7px 11px;
        border-radius: 999px;
        border: 1px solid ${tone.printAccent};
        background: ${tone.printSoft};
        color: ${tone.printDark};
        font-size: 12px;
        font-weight: 700;
        white-space: nowrap;
      }

      .status-dot {
        width: 8px;
        height: 8px;
        border-radius: 999px;
        background: ${tone.printAccent};
      }

      .body {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 252px;
        gap: 18px;
        padding: 20px 22px 18px;
      }

      .left-column {
        display: flex;
        flex-direction: column;
        gap: 14px;
        min-width: 0;
      }

      .panel {
        border: 1px solid #e2e8f0;
        border-radius: 18px;
        background: #ffffff;
        padding: 16px;
      }

      .profile-top {
        display: flex;
        align-items: center;
        gap: 14px;
        min-width: 0;
      }

      .avatar {
        width: 62px;
        height: 62px;
        border-radius: 999px;
        border: 1px solid #e2e8f0;
        object-fit: cover;
        background: #0f172a;
        flex: 0 0 auto;
      }

      .avatar-fallback {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 62px;
        height: 62px;
        border-radius: 999px;
        border: 1px solid #e2e8f0;
        background: #0f172a;
        color: #ffffff;
        font-size: 16px;
        font-weight: 700;
        flex: 0 0 auto;
      }

      .profile-label {
        margin: 0;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: #94a3b8;
      }

      .profile-name {
        margin: 4px 0 0;
        font-size: 18px;
        line-height: 1.2;
        font-weight: 700;
        color: #0f172a;
      }

      .profile-hint {
        margin: 4px 0 0;
        font-size: 12px;
        color: #64748b;
      }

      .field-sheet {
        margin-top: 14px;
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        overflow: hidden;
        border: 1px solid #e2e8f0;
        border-radius: 14px;
        background: #f8fafc;
      }

      .field {
        padding: 12px;
      }

      .field + .field {
        border-left: 1px solid #e2e8f0;
      }

      .field-label {
        margin: 0;
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        color: #94a3b8;
      }

      .field-value {
        margin: 6px 0 0;
        font-size: 13px;
        line-height: 1.45;
        font-weight: 600;
        color: #0f172a;
      }

      .field-value.mono {
        font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
      }

      .absence-strip {
        display: flex;
        flex-wrap: wrap;
        gap: 10px 18px;
        align-items: center;
        border: 1px solid #e2e8f0;
        border-radius: 18px;
        background: #f8fafc;
        padding: 13px 14px;
        font-size: 12.5px;
        color: #475569;
      }

      .absence-item {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        white-space: nowrap;
      }

      .absence-item strong {
        color: #0f172a;
        font-weight: 600;
      }

      .motif-panel {
        border: 1px solid ${tone.printAccent}33;
        border-left-width: 4px;
        border-left-color: ${tone.printAccent};
        border-radius: 18px;
        background: ${tone.printSoft};
        padding: 15px 16px;
      }

      .section-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }

      .section-label {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        color: ${tone.printDark};
      }

      .section-dot {
        width: 9px;
        height: 9px;
        border-radius: 999px;
        background: ${tone.printAccent};
      }

      .motif-text {
        margin: 10px 0 0;
        font-size: 13px;
        line-height: 1.6;
        color: #334155;
        white-space: pre-wrap;
      }

      .qr-panel {
        display: flex;
        flex-direction: column;
        border: 1px solid #e2e8f0;
        border-radius: 18px;
        background: linear-gradient(180deg, #ffffff, #f8fafc);
        padding: 16px;
      }

      .qr-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
      }

      .qr-label {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        margin: 0;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        color: #475569;
      }

      .qr-box {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 176px;
        height: 176px;
        margin: 18px auto 0;
        padding: 12px;
        border: 1px solid #dbe2ea;
        border-radius: 18px;
        background: #ffffff;
        box-shadow: 0 12px 30px rgba(15, 23, 42, 0.08);
      }

      .qr-box img {
        display: block;
        width: 100%;
        height: 100%;
      }

      .qr-caption {
        margin: 12px 0 0;
        text-align: center;
        font-size: 12px;
        line-height: 1.45;
        color: #64748b;
      }

      .footer {
        padding: 0 22px 20px;
      }

      .footer-note {
        margin: 12px 0 0;
        text-align: center;
        font-size: 11px;
        color: #94a3b8;
      }

      @media print {
        body {
          background: #ffffff;
        }

        .sheet {
          border-radius: 0;
          border: 0;
        }
      }
    </style>
    <script>
      window.addEventListener('load', function () {
        setTimeout(function () {
          window.print();
        }, 220);
      });
      window.addEventListener('afterprint', function () {
        window.close();
      });
    </script>
  </head>
  <body>
    <div class="sheet">
      <div class="header">
        <div class="header-left">
          <div class="header-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M7 3.75h7.172a2 2 0 0 1 1.414.586l3.078 3.078A2 2 0 0 1 19.25 8.83V20a2.25 2.25 0 0 1-2.25 2.25H7A2.25 2.25 0 0 1 4.75 20V6A2.25 2.25 0 0 1 7 3.75Z" stroke="currentColor" stroke-width="1.75" />
              <path d="M14.25 3.75v3.5a1.5 1.5 0 0 0 1.5 1.5h3.5" stroke="currentColor" stroke-width="1.75" />
              <path d="M8.5 11.5h7M8.5 15h7M8.5 18.5h4" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" />
            </svg>
          </div>
          <div class="header-text">
            <p class="kicker">OFPPT</p>
            <p class="title">Autorisation</p>
            <p class="code">${escapeHtml(autorisation.code)}</p>
          </div>
        </div>
        <div class="header-right">
          <div class="status-pill">
            <span class="status-dot"></span>
            <span>${escapeHtml(statusLabel)}</span>
          </div>
        </div>
      </div>

      <div class="body">
        <div class="left-column">
          <section class="panel">
            <div class="profile-top">
              ${
                photoUrl
                  ? `<img class="avatar" src="${escapeHtml(photoUrl)}" alt="${escapeHtml(stagiaireName)}" />`
                  : `<div class="avatar-fallback">${escapeHtml(getInitials(stagiaire))}</div>`
              }
              <div class="profile-text">
                <p class="profile-label">Stagiaire</p>
                <p class="profile-name">${escapeHtml(stagiaireName)}</p>
                <p class="profile-hint">Fiche reliee a l'autorisation</p>
              </div>
            </div>

            <div class="field-sheet">
              <div class="field">
                <p class="field-label">CEF</p>
                <p class="field-value mono">${escapeHtml(cef)}</p>
              </div>
              <div class="field">
                <p class="field-label">Groupe</p>
                <p class="field-value">${escapeHtml(groupe)}</p>
              </div>
              <div class="field">
                <p class="field-label">Formateur</p>
                <p class="field-value">${escapeHtml(formateur)}</p>
              </div>
            </div>
          </section>

          <section class="absence-strip">
            <span class="absence-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M8 2.75v3M16 2.75v3M4.75 9.25h14.5" stroke="#0284c7" stroke-width="1.75" stroke-linecap="round" />
                <path d="M6.75 4.75h10.5A2.75 2.75 0 0 1 20 7.5v10A2.75 2.75 0 0 1 17.25 20.25H6.75A2.75 2.75 0 0 1 4 17.5v-10A2.75 2.75 0 0 1 6.75 4.75Z" stroke="#0284c7" stroke-width="1.75" />
              </svg>
              <span>Date absence :</span>
              <strong>${escapeHtml(dateAbsence)}</strong>
            </span>
            <span class="absence-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M12 7v5l3 2" stroke="#0284c7" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" />
                <path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" stroke="#0284c7" stroke-width="1.75" />
              </svg>
              <span>Periode :</span>
              <strong>${escapeHtml(period)}</strong>
            </span>
            <span class="absence-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M8 2.75v3M16 2.75v3M4.75 9.25h14.5" stroke="#0284c7" stroke-width="1.75" stroke-linecap="round" />
                <path d="M6.75 4.75h10.5A2.75 2.75 0 0 1 20 7.5v10A2.75 2.75 0 0 1 17.25 20.25H6.75A2.75 2.75 0 0 1 4 17.5v-10A2.75 2.75 0 0 1 6.75 4.75Z" stroke="#0284c7" stroke-width="1.75" />
              </svg>
              <span>Creation :</span>
              <strong>${escapeHtml(createdAt)}</strong>
            </span>
          </section>

          <section class="motif-panel">
            <div class="section-head">
              <span class="section-label">
                <span class="section-dot"></span>
                Motif
              </span>
              <span class="status-pill">
                <span class="status-dot"></span>
                <span>${escapeHtml(statusLabel)}</span>
              </span>
            </div>
            <p class="motif-text">${escapeHtml(motif)}</p>
          </section>
        </div>

        <aside class="qr-panel">
          <div class="qr-head">
            <p class="qr-label">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M4.75 4.75h5.5v5.5h-5.5v-5.5ZM13.75 4.75h5.5v5.5h-5.5v-5.5ZM4.75 13.75h5.5v5.5h-5.5v-5.5ZM14.75 14.75h1.5v1.5h-1.5v-1.5ZM18.25 14.75h1.5v1.5h-1.5v-1.5ZM14.75 18.25h1.5v1.5h-1.5v-1.5ZM18.25 18.25h1.5v1.5h-1.5v-1.5Z" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round" />
              </svg>
              QR Code
            </p>
            <span class="status-pill">
              <span class="status-dot"></span>
              Verification
            </span>
          </div>
          <div class="qr-box">
            <img src="${escapeHtml(qrDataUrl)}" alt="QR code autorisation ${escapeHtml(autorisation.code)}" />
          </div>
          <p class="qr-caption">Scanner pour verifier l'authenticite</p>
        </aside>
      </div>
    </div>
  </body>
</html>`;
}

function CompactField({
  label,
  value,
  mono = false,
  className,
}: {
  label: string;
  value: string;
  mono?: boolean;
  className?: string;
}) {
  return (
    <div className={cn('px-3 py-2', className)}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">{label}</p>
      <p className={cn('mt-1 text-[13px] font-medium text-foreground', mono && 'font-mono')}>{value}</p>
    </div>
  );
}

export function AutorisationDetailsDialog({
  open,
  autorisation,
  onOpenChange,
  currentUser,
}: AutorisationDetailsDialogProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [qrResolvedKey, setQrResolvedKey] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const isOpen = open && Boolean(autorisation);
  const detailsStagiaire = getAutorisationStagiaire(autorisation);
  const stagiaireName = getStagiaireFullName(detailsStagiaire);
  const formateurName = getAutorisationFormateur(autorisation, currentUser);
  const photoUrl = resolveMediaUrl(detailsStagiaire?.photo);
  const motifTone = autorisation ? statusToneMap[autorisation.statut] : null;
  const currentQrKey = autorisation ? buildQrPayload(autorisation, currentUser) : '';
  const qrForCurrentAutorisation = qrResolvedKey === currentQrKey ? qrDataUrl : null;
  const isQrLoading = isOpen && Boolean(autorisation) && qrResolvedKey !== currentQrKey;

  useEffect(() => {
    let isCancelled = false;

    if (!isOpen || !currentQrKey) {
      return undefined;
    }

    const payload = currentQrKey;

    void QRCode.toDataURL(payload, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 320,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
      })
      .then((result) => {
        if (!isCancelled) {
          setQrResolvedKey(payload);
          setQrDataUrl(result);
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setQrResolvedKey(payload);
          setQrDataUrl(null);
          toast.error("Impossible de generer le QR code.");
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [isOpen, currentQrKey]);

  const handleExportPdf = async () => {
    if (!autorisation) return;

    const popup = window.open('', '_blank', 'width=1100,height=900');
    if (!popup) {
      toast.error("Impossible d'ouvrir la fenetre d'export.");
      return;
    }

    setExporting(true);

    try {
      const qr = qrForCurrentAutorisation ?? (await QRCode.toDataURL(currentQrKey, {
        errorCorrectionLevel: 'M',
        margin: 1,
        width: 320,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      }));

      popup.document.open();
      popup.document.write(
        buildPrintHtml({
          autorisation,
          currentUser,
          qrDataUrl: qr,
        }),
      );
      popup.document.close();
      popup.focus();
    } catch {
      popup.close();
      toast.error("Impossible de generer le PDF.");
    } finally {
      setExporting(false);
    }
  };

  if (!autorisation) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-[min(980px,calc(100vw-1rem))] overflow-y-auto border border-border/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(248,250,252,0.95)_100%)] p-0 text-foreground shadow-[0_32px_96px_rgba(15,23,42,0.18)] sm:h-[650px] sm:max-w-[980px] sm:overflow-hidden lg:h-[680px]"
      >
        <div className="relative flex h-full flex-col overflow-hidden">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.08),transparent_42%),radial-gradient(circle_at_top_left,rgba(16,185,129,0.06),transparent_36%)]" />

          <header className="relative flex items-start justify-between gap-3 border-b border-border/50 px-5 py-4 sm:h-[80px] sm:items-center sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 text-white shadow-sm">
                <FileText className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="truncate text-[18px] font-semibold leading-tight text-foreground">
                  Autorisation
                </DialogTitle>
                <p className="mt-1 truncate font-mono text-[12px] tracking-[0.08em] text-muted-foreground">
                  {autorisation.code}
                </p>
              </div>
            </div>

            <div className="flex flex-shrink-0 items-center gap-2">
              <AutorisationStatusBadge statut={autorisation.statut} />
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="h-8 rounded-lg border-border/60 bg-background/90 px-3 text-[12px] font-medium text-foreground hover:bg-muted/60"
              >
                <X className="mr-1.5 h-3.5 w-3.5" />
                Fermer
              </Button>
            </div>
          </header>

          <div className="relative grid flex-1 gap-4 px-5 py-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_252px] lg:py-5">
            <div className="flex min-w-0 flex-col gap-4">
              <section className="rounded-2xl border border-border/50 bg-white/90 p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <Avatar className="h-14 w-14 border border-border/50 shadow-sm" size="lg">
                    {photoUrl && (
                      <AvatarImage
                        src={photoUrl}
                        alt={stagiaireName}
                        className="object-cover"
                      />
                    )}
                    <AvatarFallback className="bg-slate-900 text-[12px] font-semibold text-white">
                      {getInitials(detailsStagiaire)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">
                      Stagiaire
                    </p>
                    <p className="truncate text-[18px] font-semibold leading-tight text-foreground">
                      {stagiaireName}
                    </p>
                    <p className="mt-1 text-[12px] text-muted-foreground">
                      Fiche reliee a l&apos;autorisation
                    </p>
                  </div>
                </div>

                <div className="mt-4 overflow-hidden rounded-2xl border border-border/40 bg-muted/20">
                  <div className="grid grid-cols-1 divide-y divide-border/40 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                    <CompactField label="CEF" value={getAutorisationCef(autorisation)} mono />
                    <CompactField label="Groupe" value={getAutorisationGroupe(autorisation)} />
                    <CompactField label="Formateur" value={formateurName || '-'} />
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-border/50 bg-muted/20 px-4 py-3">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[12.5px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5 text-primary" />
                    <span>Date absence :</span>
                    <strong className="font-medium text-foreground">
                      {compactDate(autorisation.absence?.date_absence)}
                    </strong>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Clock3 className="h-3.5 w-3.5 text-primary" />
                    <span>Periode :</span>
                    <strong className="font-medium text-foreground">
                      {getPeriodeLabel(autorisation.absence?.periode)}
                    </strong>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5 text-primary" />
                    <span>Creation :</span>
                    <strong className="font-medium text-foreground">
                      {compactDateTime(autorisation.created_at)}
                    </strong>
                  </span>
                </div>
              </section>

              <section
                className={cn(
                  'rounded-2xl border border-l-4 px-4 py-3 shadow-sm',
                  motifTone?.shell,
                )}
                style={{ borderLeftColor: motifTone?.accentColor }}
              >
                <div className="flex items-center justify-between gap-3">
                  <p
                    className={cn(
                      'inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.14em]',
                      autorisation.statut === 'en_attente'
                        ? 'text-amber-900'
                        : autorisation.statut === 'validee'
                          ? 'text-emerald-900'
                          : 'text-rose-900',
                    )}
                  >
                    <span className={cn('h-2 w-2 rounded-full', motifTone?.dot)} />
                    Motif
                  </p>
                  <AutorisationStatusBadge statut={autorisation.statut} />
                </div>
                <p className="mt-2 whitespace-pre-wrap text-[13px] leading-[1.55] text-foreground/80">
                  {autorisation.motif?.trim() || 'Aucun motif renseigne.'}
                </p>
              </section>
            </div>

            <aside className="min-w-0">
              <section className="flex h-full flex-col rounded-2xl border border-border/50 bg-gradient-to-br from-slate-50 via-white to-slate-100 px-4 py-4 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/80">
                    <QrCode className="h-4 w-4 text-primary" />
                    QR Code
                  </p>
                  <span className="text-[11px] font-medium text-muted-foreground/60">Verification</span>
                </div>

                <div className="mt-4 flex flex-1 items-center justify-center">
                  <div className="flex h-[176px] w-[176px] items-center justify-center rounded-2xl border border-border/60 bg-white p-3 shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
                    {isQrLoading ? (
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    ) : qrForCurrentAutorisation ? (
                      <Image
                        src={qrForCurrentAutorisation}
                        alt={`QR code autorisation ${autorisation.code}`}
                        width={176}
                        height={176}
                        unoptimized
                        className="block h-full w-full"
                      />
                    ) : (
                      <div className="text-center text-[12px] leading-5 text-muted-foreground">
                        QR indisponible
                      </div>
                    )}
                  </div>
                </div>

                <p className="mt-3 text-center text-[12px] leading-5 text-muted-foreground">
                  Scanner pour verifier l&apos;authenticite
                </p>
              </section>
            </aside>
          </div>

          <footer className="relative border-t border-border/40 bg-white/80 px-5 py-3.5 sm:px-6">
            <div className="flex justify-center">
              <Button
                type="button"
                onClick={() => void handleExportPdf()}
                disabled={exporting}
                className="h-9 rounded-lg bg-primary px-4 text-[13px] font-medium text-white hover:bg-primary-hover"
              >
                {exporting ? (
                  <>
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                    Export en cours...
                  </>
                ) : (
                  <>
                    <FileDown className="mr-1.5 h-4 w-4" />
                    Exporter PDF
                  </>
                )}
              </Button>
            </div>
          </footer>
        </div>
      </DialogContent>
    </Dialog>
  );
}
