/**
 * SalesCitationPanel — Phase 9: Sales Intelligence Agent UI.
 *
 * Renders resolved evidence sources backing the Sales Agent findings.
 */

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Bookmark } from 'lucide-react';
import type { AiSourceReference } from '../../../../types/ai-query';

interface SalesCitationPanelProps {
  evidence: AiSourceReference[];
}

export const SalesCitationPanel: React.FC<SalesCitationPanelProps> = ({ evidence }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (evidence.length === 0) return null;

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bookmark size={16} className="text-indigo-400" />
          <h3 className="text-sm font-semibold text-slate-200">
            Retrieved Evidence Sources ({evidence.length})
          </h3>
        </div>
        <span className="text-xs text-slate-500">Grounded in Organization Knowledge</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {evidence.map((source) => {
          const isExpanded = expandedId === source.id;

          return (
            <div
              key={source.id}
              className="bg-slate-800/50 border border-slate-700/60 rounded-lg p-3.5 space-y-2 hover:border-slate-600 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="px-2 py-0.5 rounded text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shrink-0">
                    {source.id}
                  </span>
                  <span className="text-xs font-medium text-slate-200 truncate" title={source.documentName}>
                    {source.documentName}
                  </span>
                </div>
                <span className="text-[11px] font-mono text-emerald-400 shrink-0">
                  {(source.score * 100).toFixed(0)}% score
                </span>
              </div>

              {/* Location metadata */}
              <div className="flex items-center gap-3 text-[11px] text-slate-400">
                {source.sectionHeading && (
                  <span className="truncate" title={source.sectionHeading}>
                    Section: {source.sectionHeading}
                  </span>
                )}
                {source.pageNumber !== null && <span>Page {source.pageNumber}</span>}
                {source.sheetName && <span>Sheet: {source.sheetName}</span>}
              </div>

              {/* Excerpt */}
              <p
                className={`text-xs text-slate-300 bg-slate-950/40 p-2.5 rounded border border-slate-800/80 leading-relaxed font-mono ${
                  !isExpanded ? 'line-clamp-2' : ''
                }`}
              >
                "{source.excerpt}"
              </p>

              {source.excerpt.length > 120 && (
                <button
                  type="button"
                  onClick={() => setExpandedId(isExpanded ? null : source.id)}
                  className="inline-flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 font-medium"
                >
                  {isExpanded ? (
                    <>
                      Show Less <ChevronUp size={12} />
                    </>
                  ) : (
                    <>
                      View Full Chunk Excerpt <ChevronDown size={12} />
                    </>
                  )}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
