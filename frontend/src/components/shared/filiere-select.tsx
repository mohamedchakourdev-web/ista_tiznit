'use client';

import * as React from 'react';
import type { Filiere } from '@/types';
import { cn } from '@/lib/utils';
import { getFiliereName } from '@/utils/domain';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type FiliereSelectProps = {
  filieres?: Filiere[];
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  includeAll?: boolean;
  allLabel?: string;
  allValue?: string;
  disabled?: boolean;
  className?: string;
  contentClassName?: string;
};

export function FiliereSelect({
  filieres = [],
  value = '',
  onValueChange,
  placeholder = 'Sélectionner',
  includeAll = false,
  allLabel = 'Toutes filières',
  allValue = 'all',
  disabled,
  className,
  contentClassName,
}: FiliereSelectProps) {
  const items = React.useMemo(
    () => [
      ...(includeAll ? [{ label: allLabel, value: allValue }] : []),
      ...filieres.map((filiere) => ({
        label: getFiliereName(filiere),
        value: String(filiere.id),
      })),
    ],
    [allLabel, allValue, filieres, includeAll],
  );

  return (
    <Select disabled={disabled} items={items} value={value} onValueChange={(nextValue) => onValueChange(String(nextValue ?? ''))}>
      <SelectTrigger
        className={cn(
          'h-auto min-h-9 w-full min-w-0 whitespace-normal rounded-lg border-border/50 bg-muted/30 py-1.5 text-[14px] leading-snug *:data-[slot=select-value]:line-clamp-none *:data-[slot=select-value]:whitespace-normal',
          className,
        )}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent
        align="start"
        alignItemWithTrigger={false}
        className={cn(
          'w-max min-w-[var(--anchor-width)] max-w-[min(42rem,calc(100vw-2rem))] overflow-x-visible',
          contentClassName,
        )}
      >
        {includeAll && <SelectItem value={allValue}>{allLabel}</SelectItem>}
        {filieres.map((filiere) => (
          <SelectItem key={filiere.id} value={String(filiere.id)}>
            {getFiliereName(filiere)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
