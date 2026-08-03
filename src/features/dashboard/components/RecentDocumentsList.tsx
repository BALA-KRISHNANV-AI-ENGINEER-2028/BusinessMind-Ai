import { FileText } from 'lucide-react';
import type { DocumentSummary } from '../../../types/business';

export function RecentDocumentsList({ documents }: { documents: DocumentSummary[] }) {
  return (
    <ul className="divide-y divide-border">
      {documents.map((doc) => (
        <li key={doc.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-bg-muted text-text-secondary">
            <FileText size={16} aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-text-primary">{doc.name}</p>
            <p className="text-xs text-text-secondary">Updated {doc.updatedLabel}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
