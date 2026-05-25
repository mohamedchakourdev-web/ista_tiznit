'use client';

import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { PaginationMeta } from '@/types';

interface PaginationProps {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
}

export function Pagination({ meta, onPageChange }: PaginationProps) {
  if (meta.last_page <= 1) return null;

  return (
    <div className="flex items-center justify-between px-2 py-4">
      <p className="text-[14px] text-muted-foreground">
        {meta.from && meta.to ? (
          <>
            <span className="font-semibold text-foreground">{meta.from}</span>
            {' – '}
            <span className="font-semibold text-foreground">{meta.to}</span>
            {' sur '}
            <span className="font-semibold text-foreground">{meta.total}</span>
          </>
        ) : (
          'Aucun résultat'
        )}
      </p>
      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(meta.current_page - 1)}
          disabled={meta.current_page <= 1}
          className="h-9 w-9 p-0 rounded-lg border-border"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        {Array.from({ length: Math.min(meta.last_page, 5) }, (_, i) => {
          let page: number;
          if (meta.last_page <= 5) {
            page = i + 1;
          } else if (meta.current_page <= 3) {
            page = i + 1;
          } else if (meta.current_page >= meta.last_page - 2) {
            page = meta.last_page - 4 + i;
          } else {
            page = meta.current_page - 2 + i;
          }
          return (
            <Button
              key={page}
              variant={page === meta.current_page ? 'default' : 'outline'}
              size="sm"
              onClick={() => onPageChange(page)}
              className={`h-9 w-9 p-0 text-[13px] rounded-lg ${
                page === meta.current_page
                  ? 'bg-foreground hover:bg-foreground/90 text-background border-transparent'
                  : 'border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {page}
            </Button>
          );
        })}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(meta.current_page + 1)}
          disabled={meta.current_page >= meta.last_page}
          className="h-9 w-9 p-0 rounded-lg border-border"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
