/**
 * SalesFindingsPanel — Phase 9: Sales Intelligence Agent UI.
 *
 * Renders the structured findings array from the Sales Agent result.
 * Distinctly styles 'fact' vs 'inference' claims.
 */

import React from 'react';
import { CheckCircle2, Lightbulb, FileText } from 'lucide-react';
import type { AgentFinding } from '../../../../types/agents';

interface SalesFindingsPanelProps {
  findings: AgentFinding[];
}

export const SalesFindingsPanel: React.FC<SalesFindingsPanelProps> = ({ findings }) => {
  if (findings.length === 0) return null;

  const factsCount = findings.filter((f) => f.type === 'fact').length;
  const inferencesCount = findings.filter((f) => f.type === 'inference').length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <FileText size={16} className="text-indigo-400" />
          Structured Sales Findings ({findings.length})
        </h3>
        <div className="flex items-center gap-3 text-xs">
          <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
            <CheckCircle2 size={12} />
            {factsCount} Fact{factsCount !== 1 ? 's' : ''}
          </span>
          <span className="inline-flex items-center gap-1 text-amber-400 font-medium">
            <Lightbulb size={12} />
            {inferencesCount} Inference{inferencesCount !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {findings.map((item, index) => {
          const isFact = item.type === 'fact';

          return (
            <div
              key={index}
              className={`p-4 rounded-xl border transition-all ${
                isFact
                  ? 'bg-slate-900/60 border-slate-800 hover:border-emerald-500/30'
                  : 'bg-amber-950/10 border-amber-900/30 hover:border-amber-500/30'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="mt-0.5 shrink-0">
                    {isFact ? (
                      <CheckCircle2 size={16} className="text-emerald-400" />
                    ) : (
                      <Lightbulb size={16} className="text-amber-400" />
                    )}
                  </div>

                  <div className="space-y-1.5 min-w-0">
                    <p className="text-sm text-slate-100 leading-relaxed font-normal">
                      {item.finding}
                    </p>

                    {/* Citations */}
                    {item.citations.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap pt-1">
                        <span className="text-[11px] text-slate-400">Sources:</span>
                        {item.citations.map((citeId) => (
                          <span
                            key={citeId}
                            className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30"
                          >
                            {citeId}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Finding Type Pill */}
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase shrink-0 ${
                    isFact
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/25'
                  }`}
                >
                  {item.type}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
