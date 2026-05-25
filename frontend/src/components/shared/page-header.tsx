'use client';

import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
  icon?: React.ElementType;
}

export function PageHeader({ title, description, children, className, icon: Icon }: PageHeaderProps) {
  return (
    <div className={cn('flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between', className)}>
      <div>
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon className="h-[17px] w-[17px]" />
            </div>
          )}
          <h1 className="text-[22px] font-semibold tracking-tight text-foreground leading-tight">{title}</h1>
        </div>
        {description && (
          <p className="text-[15px] text-muted-foreground mt-1.5 leading-relaxed">{description}</p>
        )}
      </div>
      {children && (
        <div className="flex items-center gap-2.5 mt-4 sm:mt-0">{children}</div>
      )}
    </div>
  );
}
