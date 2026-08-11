/**
 * EvidenceResultCard Component — Phase 7: RAG Retrieval Test UI.
 *
 * Displays a single evidence chunk result with score badge, citation metadata
 * (page number, sheet name, section heading), and document source link.
 */

import React from 'react';
import { FileText, Bookmark, Target, Cpu } from 'lucide-react';
import type { EvidenceItem } from '../../../services/retrieval.api';

interface EvidenceResultCardProps {
  evidence: EvidenceItem;
  rank: number;
}

export const EvidenceResultCard: React.FC<EvidenceResultCardProps> = ({ evidence, rank }) => {
  const scorePct = Math.round(evidence.score * 100);

  // Score color badge: green >= 85%, indigo >= 75%, amber < 75%
  const scoreBadgeColor =
    scorePct >= 85
      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
      : scorePct >= 75
      ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
      : 'bg-amber-500/10 text-amber-400 border-amber-500/30';

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 hover:border-indigo-500/40 transition-all duration-200 shadow-md">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <span className="w-6 h-6 rounded-full bg-slate-800 text-slate-400 text-xs font-semibold flex items-center justify-center border border-slate-700">
            #{rank}
          </span>
          <div className="flex items-center gap-1.5 font-medium text-slate-200 text-sm">
            <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
            <span className="truncate max-w-[280px] sm:max-w-md">{evidence.documentName}</span>
          </div>
        </div>

        <div className={`px-2.5 py-1 rounded-md text-xs font-semibold border flex items-center gap-1 shrink-0 ${scoreBadgeColor}`}>
          <Target className="w-3 h-3" />
          <span>{scorePct}% Match</span>
        </div>
      </div>

      {/* Chunk text content */}
      <p className="text-slate-300 text-sm leading-relaxed bg-slate-950/60 p-3.5 rounded-lg border border-slate-800/80 mb-3 font-mono text-[13px]">
        "{evidence.text}"
      </p>

      {/* Source Citation Metadata Footer */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 pt-2 border-t border-slate-800/60">
        {evidence.metadata.pageNumber && (
          <span className="flex items-center gap-1 bg-slate-800/50 px-2 py-0.5 rounded border border-slate-700/50">
            <Bookmark className="w-3 h-3 text-indigo-400" />
            Page {evidence.metadata.pageNumber}
          </span>
        )}

        {evidence.metadata.sheetName && (
          <span className="flex items-center gap-1 bg-slate-800/50 px-2 py-0.5 rounded border border-slate-700/50">
            <Bookmark className="w-3 h-3 text-emerald-400" />
            Sheet: {evidence.metadata.sheetName}
          </span>
        )}

        {evidence.metadata.sectionHeading && (
          <span className="flex items-center gap-1 bg-slate-800/50 px-2 py-0.5 rounded border border-slate-700/50 max-w-[200px] truncate">
            Section: {evidence.metadata.sectionHeading}
          </span>
        )}

        <span className="text-slate-500">Chunk #{evidence.chunkIndex}</span>

        {evidence.embeddingModel && (
          <span className="ml-auto flex items-center gap-1 text-[11px] text-slate-500 font-mono">
            <Cpu className="w-3 h-3 text-slate-600" />
            {evidence.embeddingModel}
          </span>
        )}
      </div>
    </div>
  );
};
