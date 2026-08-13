/**
 * GroundedAiResponse — Phase 8: LLM Integration.
 *
 * Renders the full AI query result: answer text, confidence badge,
 * limitations, and sources panel.
 *
 * The answer text may contain inline citation markers like [S1][S2].
 * These are rendered as highlighted spans linking to the sources section.
 */

import { ChevronDown, ChevronUp, AlertTriangle, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import { CitationSource } from './CitationSource';
import { InsufficientEvidenceCard } from './InsufficientEvidenceCard';
import type { AiQueryResponse, AiConfidenceLevel } from '../../../types/ai-query';

interface GroundedAiResponseProps {
  response: AiQueryResponse;
}

// ─── Confidence Badge ─────────────────────────────────────────────────────────

const CONFIDENCE_STYLES: Record<AiConfidenceLevel, { label: string; classes: string }> = {
  high: {
    label: 'High Confidence',
    classes: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
  },
  medium: {
    label: 'Medium Confidence',
    classes: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/25',
  },
  low: {
    label: 'Low Confidence',
    classes: 'bg-amber-500/10 text-amber-400 border-amber-500/25',
  },
  insufficient: {
    label: 'Insufficient Evidence',
    classes: 'bg-amber-500/10 text-amber-400 border-amber-500/25',
  },
};

function ConfidenceBadge({ level }: { level: AiConfidenceLevel }) {
  const config = CONFIDENCE_STYLES[level];
  return (
    <span className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[11px] font-semibold ${config.classes}`}>
      <TrendingUp size={9} aria-hidden="true" />
      {config.label}
    </span>
  );
}

// ─── Answer Text with Citation Markers ────────────────────────────────────────

/**
 * Renders answer text, highlighting inline [S1], [S2] citation markers.
 */
function AnswerText({ text }: { text: string }) {
  // Split by citation markers e.g., [S1], [S2]
  const parts = text.split(/(\[S\d+\])/g);

  return (
    <p className="text-sm text-text-primary leading-relaxed whitespace-pre-wrap">
      {parts.map((part, i) => {
        if (/^\[S\d+\]$/.test(part)) {
          return (
            <span
              key={i}
              className="inline-flex items-center rounded bg-accent-subtle px-1 font-mono text-[11px] font-bold text-accent-text mx-0.5 cursor-default"
              title={`Evidence source ${part.replace(/[\[\]]/g, '')}`}
              aria-label={`Citation ${part.replace(/[\[\]]/g, '')}`}
            >
              {part}
            </span>
          );
        }
        return part;
      })}
    </p>
  );
}

// ─── Grounded AI Response ─────────────────────────────────────────────────────

export function GroundedAiResponse({ response }: GroundedAiResponseProps) {
  const [sourcesExpanded, setSourcesExpanded] = useState(true);

  const isInsufficient = response.confidence === 'insufficient';

  return (
    <div className="w-full space-y-3">
      {/* Confidence + metadata row */}
      <div className="flex items-center gap-2 flex-wrap">
        <ConfidenceBadge level={response.confidence} />
        {response.metadata && (
          <span className="text-[11px] text-text-disabled font-mono">
            {response.metadata.totalTimeMs}ms · {response.metadata.model}
          </span>
        )}
      </div>

      {/* Answer text (or insufficient card) */}
      {isInsufficient ? (
        <InsufficientEvidenceCard limitations={response.limitations} />
      ) : (
        <AnswerText text={response.answer} />
      )}

      {/* Limitations */}
      {!isInsufficient && response.limitations.length > 0 && (
        <div className="flex items-start gap-2 rounded-md border border-amber-500/20 bg-amber-500/5 p-2.5">
          <AlertTriangle
            size={13}
            className="mt-0.5 shrink-0 text-amber-400"
            aria-hidden="true"
          />
          <ul className="space-y-0.5">
            {response.limitations.map((lim, i) => (
              <li key={i} className="text-xs text-amber-300/80">
                {lim}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Sources panel */}
      {response.sources.length > 0 && (
        <div className="rounded-lg border border-border bg-bg-subtle overflow-hidden">
          <button
            type="button"
            onClick={() => setSourcesExpanded((prev) => !prev)}
            className="flex w-full items-center justify-between gap-2 px-3.5 py-2.5 text-xs font-semibold text-text-secondary hover:bg-bg-muted transition-colors duration-150"
            aria-expanded={sourcesExpanded}
          >
            <span>
              Sources{' '}
              <span className="ml-1 rounded-full bg-accent-subtle px-1.5 py-0.5 font-mono text-[10px] text-accent-text">
                {response.sources.length}
              </span>
            </span>
            {sourcesExpanded ? (
              <ChevronUp size={13} aria-hidden="true" />
            ) : (
              <ChevronDown size={13} aria-hidden="true" />
            )}
          </button>

          {sourcesExpanded && (
            <div className="space-y-2 p-3 border-t border-border">
              {response.sources.map((source) => (
                <CitationSource key={source.id} source={source} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
