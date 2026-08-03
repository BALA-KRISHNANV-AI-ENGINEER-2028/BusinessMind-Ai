import type { HTMLAttributes } from 'react';
import { cn } from '../../../lib/utils';

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-bg-muted', className)}
      aria-hidden="true"
      {...props}
    />
  );
}

/** Convenience preset: a card-shaped skeleton, e.g. for MetricCard loading state. */
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-3 rounded-lg border border-border p-4', className)}>
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-6 w-16" />
      <Skeleton className="h-3 w-32" />
    </div>
  );
}

/** Convenience preset: a row of skeleton cells, e.g. for Table loading state. */
export function TableRowSkeleton({ columns = 4 }: { columns?: number }) {
  return (
    <div className="flex items-center gap-4 border-b border-border px-4 py-3">
      {Array.from({ length: columns }).map((_, index) => (
        <Skeleton key={index} className="h-4 flex-1" />
      ))}
    </div>
  );
}
