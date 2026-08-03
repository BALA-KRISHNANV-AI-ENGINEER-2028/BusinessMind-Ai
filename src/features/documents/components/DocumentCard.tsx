import { FileText, FileSpreadsheet, FileType } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { DocumentStatusBadge } from './DocumentStatusBadge';
import { Badge } from '../../../components/ui/Badge';
import type { DocumentSummary } from '../../../types/business';

const fileIconMap: Record<string, typeof FileText> = {
  pdf: FileType,
  docx: FileText,
  xlsx: FileSpreadsheet,
};

interface DocumentCardProps {
  document: DocumentSummary;
  className?: string;
}

export function DocumentCard({ document, className }: DocumentCardProps) {
  const Icon = fileIconMap[document.fileType] ?? FileText;

  return (
    <div
      className={cn(
        'group flex flex-col gap-3 rounded-lg border border-border bg-bg-base p-4 transition-shadow duration-150 hover:shadow-sm',
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-accent-subtle text-accent-text">
          <Icon size={20} aria-hidden="true" />
        </div>
        {document.status && <DocumentStatusBadge status={document.status} />}
      </div>

      {/* Filename */}
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-text-primary" title={document.name}>
          {document.name}
        </p>
        {document.category && (
          <p className="mt-0.5 text-xs text-text-secondary">{document.category}</p>
        )}
      </div>

      {/* Tags */}
      {document.tags && document.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {document.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="neutral" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="mt-auto flex items-center justify-between border-t border-border pt-2 text-xs text-text-disabled">
        <span>{document.uploadedBy}</span>
        <span>{document.updatedLabel}</span>
      </div>
    </div>
  );
}
