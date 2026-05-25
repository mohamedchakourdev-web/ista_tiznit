'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type StatusVariant = 'success' | 'danger' | 'warning' | 'info' | 'neutral';

const variantStyles: Record<StatusVariant, string> = {
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
  danger: 'bg-red-50 text-red-700 border-red-200/60',
  warning: 'bg-amber-50 text-amber-700 border-amber-200/60',
  info: 'bg-blue-50 text-blue-700 border-blue-200/60',
  neutral: 'bg-slate-50 text-slate-600 border-slate-200/60',
};

const dotColors: Record<StatusVariant, string> = {
  success: 'bg-emerald-500',
  danger: 'bg-red-500',
  warning: 'bg-amber-500',
  info: 'bg-blue-500',
  neutral: 'bg-slate-400',
};

interface StatusBadgeProps {
  variant: StatusVariant;
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}

export function StatusBadge({ variant, children, className, dot = true }: StatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'gap-1.5 whitespace-nowrap rounded-md border px-2 py-0.5 text-[12px] font-medium',
        variantStyles[variant],
        className,
      )}
    >
      {dot && <span className={cn('inline-block h-1.5 w-1.5 shrink-0 rounded-full', dotColors[variant])} />}
      {children}
    </Badge>
  );
}

export function AbsenceTypeBadge({ type }: { type: string }) {
  return (
    <StatusBadge variant={type === 'absence' ? 'danger' : 'warning'}>
      {type === 'absence' ? 'Absence' : 'Retard'}
    </StatusBadge>
  );
}

export function JustificationBadge({ justification }: { justification: string }) {
  const map: Record<string, { variant: StatusVariant; label: string }> = {
    justifie: { variant: 'success', label: 'Justifie' },
    non_justifie: { variant: 'danger', label: 'Non justifie' },
    autorise_avant: { variant: 'info', label: 'Autorise avant' },
  };
  const item = map[justification] || { variant: 'neutral' as StatusVariant, label: justification };
  return <StatusBadge variant={item.variant}>{item.label}</StatusBadge>;
}

export function AutorisationStatusBadge({ statut }: { statut: string }) {
  const map: Record<string, { variant: StatusVariant; label: string }> = {
    en_attente: { variant: 'warning', label: 'En attente' },
    validee: { variant: 'success', label: 'Validee' },
    refusee: { variant: 'danger', label: 'Refusee' },
  };
  const item = map[statut] || { variant: 'neutral' as StatusVariant, label: statut };

  return <StatusBadge variant={item.variant}>{item.label}</StatusBadge>;
}

export function ReadStatusBadge({ isRead }: { isRead: boolean }) {
  return <StatusBadge variant={isRead ? 'neutral' : 'info'}>{isRead ? 'Lu' : 'Non lu'}</StatusBadge>;
}

export function PeriodBadge({ period }: { period: string }) {
  const isMorning = period === 'matin';
  return (
    <StatusBadge variant={isMorning ? 'info' : 'warning'} dot={false}>
      {isMorning ? 'Matin' : 'Apres-midi'}
    </StatusBadge>
  );
}
