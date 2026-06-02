'use client';

import { Check, ChevronsUpDown } from 'lucide-react';
import type { Absence } from '@/types';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { compactDate, getPeriodeLabel } from '@/utils/domain';

interface AbsencesMultiSelectProps {
  options: Absence[];
  value: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
  loading?: boolean;
  placeholder?: string;
}

function describeAbsenceOption(absence: Absence): string {
  const type = absence.type === 'absence' ? 'Absence' : 'Retard';
  return `Le ${compactDate(absence.date_absence)} - ${getPeriodeLabel(absence.periode)} (${type})`;
}

export function AbsencesMultiSelect({
  options,
  value,
  onChange,
  disabled = false,
  loading = false,
  placeholder = 'Sélectionner une ou plusieurs absences',
}: AbsencesMultiSelectProps) {
  const allIds = options.map((absence) => String(absence.id));
  const allSelected = allIds.length > 0 && allIds.every((id) => value.includes(id));

  const toggle = (id: string) => {
    onChange(value.includes(id) ? value.filter((current) => current !== id) : [...value, id]);
  };

  const toggleAll = () => {
    onChange(allSelected ? [] : allIds);
  };

  const triggerLabel = value.length > 0
    ? `${value.length} absence${value.length > 1 ? 's' : ''} sélectionnée${value.length > 1 ? 's' : ''}`
    : placeholder;

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            disabled={disabled || loading}
            className="h-9 w-full justify-between rounded-lg border-border/50 bg-muted/30 px-3 text-left text-[14px] font-normal hover:bg-muted/40"
          />
        }
      >
        <span className={cn('truncate', value.length === 0 && 'text-muted-foreground')}>
          {loading ? 'Chargement des absences...' : triggerLabel}
        </span>
        <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[510px] max-w-[calc(100vw-2rem)] p-1">
        {options.length === 0 ? (
          <div className="px-2 py-2 text-[13px] text-muted-foreground">Aucune absence à justifier.</div>
        ) : (
          <>
            <button
              type="button"
              onClick={toggleAll}
              className="mb-1 flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-[13px] font-medium text-primary outline-none transition-colors hover:bg-muted/60 focus:bg-muted/60"
            >
              {allSelected ? 'Tout désélectionner' : 'Sélectionner toutes les absences'}
            </button>
            <div className="max-h-56 overflow-y-auto">
              {options.map((absence) => {
                const id = String(absence.id);
                const isSelected = value.includes(id);

                return (
                  <button
                    key={absence.id}
                    type="button"
                    onClick={() => toggle(id)}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left outline-none transition-colors hover:bg-muted/60 focus:bg-muted/60"
                  >
                    <span
                      className={cn(
                        'flex size-4 shrink-0 items-center justify-center rounded-[4px] border',
                        isSelected
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-input bg-background',
                      )}
                    >
                      {isSelected && <Check className="size-3" />}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[13px] text-foreground">
                      {describeAbsenceOption(absence)}
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
