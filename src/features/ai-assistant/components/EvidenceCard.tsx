import { Quote } from 'lucide-react';
import type { EvidenceItem } from '../../../types/chat';

export function EvidenceCard({ evidence }: { evidence: EvidenceItem }) {
  return (
    <div className="flex gap-2.5 rounded-md border border-border bg-bg-base p-3">
      <Quote size={16} className="mt-0.5 shrink-0 text-text-secondary" aria-hidden="true" />
      <div className="min-w-0">
        <p className="text-xs font-medium text-text-secondary">{evidence.source}</p>
        <p className="mt-1 text-sm text-text-primary">{evidence.snippet}</p>
      </div>
    </div>
  );
}
