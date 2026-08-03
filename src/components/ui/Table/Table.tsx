import type { ReactNode } from 'react';
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { TableRowSkeleton } from '../Skeleton';
import { EmptyState } from '../EmptyState';

export interface TableColumn<T> {
  key: string;
  header: string;
  /** Custom cell renderer. Falls back to `String(row[key])` if omitted. */
  render?: (row: T) => ReactNode;
  sortable?: boolean;
  align?: 'left' | 'right' | 'center';
  className?: string;
}

export interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  sortKey?: string;
  sortDirection?: 'asc' | 'desc';
  onSortChange?: (key: string) => void;
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  onRowClick?: (row: T) => void;
}

const alignClasses = {
  left: 'text-left',
  right: 'text-right',
  center: 'text-center',
};

/**
 * A single responsive Table implementation used everywhere in the app.
 * On narrow viewports it scrolls horizontally rather than reflowing into
 * cards — this keeps one render path (no duplicated mobile markup) and
 * matches the horizontal-scroll pattern used by Stripe Dashboard / Linear.
 */
export function Table<T>({
  columns,
  data,
  keyExtractor,
  sortKey,
  sortDirection = 'asc',
  onSortChange,
  isLoading,
  emptyTitle = 'No results',
  emptyDescription = 'There is no data to display yet.',
  onRowClick,
}: TableProps<T>) {
  if (!isLoading && data.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-border bg-bg-subtle">
            {columns.map((column) => {
              const isSorted = sortKey === column.key;
              return (
                <th
                  key={column.key}
                  scope="col"
                  aria-sort={
                    column.sortable
                      ? isSorted
                        ? sortDirection === 'asc'
                          ? 'ascending'
                          : 'descending'
                        : 'none'
                      : undefined
                  }
                  className={cn(
                    'px-4 py-2.5 font-medium text-text-secondary',
                    alignClasses[column.align ?? 'left'],
                  )}
                >
                  {column.sortable ? (
                    <button
                      type="button"
                      onClick={() => onSortChange?.(column.key)}
                      className="inline-flex items-center gap-1 hover:text-text-primary"
                    >
                      {column.header}
                      {isSorted ? (
                        sortDirection === 'asc' ? (
                          <ArrowUp size={14} aria-hidden="true" />
                        ) : (
                          <ArrowDown size={14} aria-hidden="true" />
                        )
                      ) : (
                        <ArrowUpDown size={14} className="text-text-disabled" aria-hidden="true" />
                      )}
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {isLoading
            ? Array.from({ length: 5 }).map((_, index) => (
                <tr key={index}>
                  <td colSpan={columns.length} className="p-0">
                    <TableRowSkeleton columns={columns.length} />
                  </td>
                </tr>
              ))
            : data.map((row) => (
                <tr
                  key={keyExtractor(row)}
                  onClick={() => onRowClick?.(row)}
                  tabIndex={onRowClick ? 0 : undefined}
                  role={onRowClick ? 'button' : undefined}
                  onKeyDown={
                    onRowClick
                      ? (event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            onRowClick(row);
                          }
                        }
                      : undefined
                  }
                  className={cn(
                    'border-b border-border last:border-b-0',
                    onRowClick && 'cursor-pointer hover:bg-bg-subtle focus-visible:bg-bg-subtle',
                  )}
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={cn(
                        'px-4 py-3 text-text-primary',
                        alignClasses[column.align ?? 'left'],
                        column.className,
                      )}
                    >
                      {column.render ? column.render(row) : String((row as Record<string, unknown>)[column.key] ?? '')}
                    </td>
                  ))}
                </tr>
              ))}
        </tbody>
      </table>
    </div>
  );
}
