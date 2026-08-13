/**
 * CitationSource — Phase 8: LLM Integration.
 *
 * Renders a single source reference from the AI's answer.
 * Shown in the "Sources" panel below each AI response.
 *
 * Displays:
 *   - Citation label: [S1], [S2]
 *   - Document name and type icon
 *   - Page number, sheet name, or section heading
 *   - Relevance score badge
 *   - Excerpt preview
 */

import { FileText, BookOpen, Table2, Bookmark, Target } from 'lucide-react';
import type { AiSourceReference } from '../../../types/ai-query';

interface CitationSourceProps {
  source: AiSourceReference;
}

/** Pick icon based on file extension. */
function getDocIcon(documentName: string) {
  const lower = documentName.toLowerCase();
  if (lower.endsWith('.xlsx') || lower.endsWith('.csv') || lower.endsWith('.xls')) {
    return Table2;
  }
  if (lower.endsWith('.docx') || lower.endsWith('.doc')) {
    return BookOpen;
  }
  return FileText;
}

/** Score badge colour based on similarity score. */
function getScoreBadgeClass(score: number) {
  const pct = Math.round(score * 100);
  if (pct >= 85) return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25';
  if (pct >= 75) return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/25';
  return 'bg-amber-500/10 text-amber-400 border-amber-500/25';
}

export function CitationSource({ source }: CitationSourceProps) {
  const DocIcon = getDocIcon(source.documentName);
  const scorePct = Math.round(source.score * 100);
  const scoreBadgeClass = getScoreBadgeClass(source.score);

  return (
    <div className="group rounded-lg border border-border bg-bg-subtle p-3.5 hover:border-border-strong transition-colors duration-150">
      {/* Header row */}
      <div className="flex items-start gap-2.5 mb-2.5">
        {/* Citation label badge */}
        <span className="inline-flex h-5 shrink-0 items-center rounded bg-accent-subtle px-1.5 font-mono text-[11px] font-bold text-accent-text">
          {source.id}
        </span>

        {/* Document name */}
        <div className="flex min-w-0 items-center gap-1.5 flex-1">
          <DocIcon size={13} className="shrink-0 text-text-secondary" aria-hidden="true" />
          <span className="truncate text-xs font-medium text-text-primary">
            {source.documentName}
          </span>
        </div>

        {/* Score badge */}
        <span
          className={`flex shrink-0 items-center gap-1 rounded border px-2 py-0.5 text-[11px] font-semibold ${scoreBadgeClass}`}
          title={`${scorePct}% relevance match`}
        >
          <Target size={9} aria-hidden="true" />
          {scorePct}%
        </span>
      </div>

      {/* Source metadata (page, sheet, section) */}
      {(source.pageNumber || source.sheetName || source.sectionHeading) && (
        <div className="flex flex-wrap gap-1.5 mb-2.5">
          {source.pageNumber && (
            <span className="flex items-center gap-1 rounded bg-bg-base px-2 py-0.5 text-[11px] text-text-secondary border border-border">
              <Bookmark size={9} className="text-indigo-400" aria-hidden="true" />
              Page {source.pageNumber}
            </span>
          )}
          {source.sheetName && (
            <span className="flex items-center gap-1 rounded bg-bg-base px-2 py-0.5 text-[11px] text-text-secondary border border-border">
              <Table2 size={9} className="text-emerald-400" aria-hidden="true" />
              {source.sheetName}
            </span>
          )}
          {source.sectionHeading && (
            <span className="flex items-center gap-1 rounded bg-bg-base px-2 py-0.5 text-[11px] text-text-secondary border border-border max-w-[200px] truncate">
              {source.sectionHeading}
            </span>
          )}
        </div>
      )}

      {/* Excerpt */}
      <p className="text-[12px] leading-relaxed text-text-secondary line-clamp-3 font-mono bg-bg-base rounded px-2.5 py-2 border border-border/50">
        "{source.excerpt}"
      </p>
    </div>
  );
}
