/**
 * InsufficientEvidenceCard — Phase 8: LLM Integration.
 *
 * Shown when the AI returns confidence: 'insufficient'.
 * Provides a clear, actionable message instead of a vague error.
 */

import { SearchX, Upload } from 'lucide-react';

interface InsufficientEvidenceCardProps {
  limitations?: string[];
}

export function InsufficientEvidenceCard({ limitations = [] }: InsufficientEvidenceCardProps) {
  return (
    <div className="rounded-lg border border-amber-500/25 bg-amber-500/5 p-4">
      <div className="flex items-center gap-2.5 mb-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-amber-500/10">
          <SearchX size={16} className="text-amber-400" aria-hidden="true" />
        </span>
        <div>
          <p className="text-sm font-semibold text-text-primary">Insufficient Evidence</p>
          <p className="text-xs text-text-secondary">No relevant documents were found for this query</p>
        </div>
      </div>

      {limitations.length > 0 && (
        <ul className="mb-3 space-y-1.5">
          {limitations.map((limitation, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-text-secondary">
              <span className="mt-0.5 shrink-0 size-1.5 rounded-full bg-amber-500/60 mt-1.5" aria-hidden="true" />
              {limitation}
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center gap-2 pt-3 border-t border-amber-500/15">
        <Upload size={12} className="text-text-secondary shrink-0" aria-hidden="true" />
        <p className="text-xs text-text-secondary">
          Upload documents to the Knowledge Base to enable evidence-grounded AI analysis.
        </p>
      </div>
    </div>
  );
}
