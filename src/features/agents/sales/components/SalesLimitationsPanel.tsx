/**
 * SalesLimitationsPanel — Phase 9: Sales Intelligence Agent UI.
 *
 * Displays limitations, gaps, caveats, and optional risks.
 */

import React from 'react';
import { AlertTriangle, ShieldAlert } from 'lucide-react';
import type { AgentRisk } from '../../../../types/agents';

interface SalesLimitationsPanelProps {
  limitations: string[];
  risks?: AgentRisk[];
}

export const SalesLimitationsPanel: React.FC<SalesLimitationsPanelProps> = ({
  limitations,
  risks,
}) => {
  if (limitations.length === 0 && (!risks || risks.length === 0)) {
    return null;
  }

  return (
    <div className="space-y-3">
      {/* Risks */}
      {risks && risks.length > 0 && (
        <div className="bg-rose-950/20 border border-rose-800/40 rounded-lg p-4 space-y-2">
          <div className="flex items-center gap-2 text-rose-400 font-medium text-xs uppercase tracking-wider">
            <ShieldAlert size={14} />
            <span>Identified Business Risks ({risks.length})</span>
          </div>
          <ul className="space-y-1.5 text-xs text-rose-200/90 pl-5 list-disc">
            {risks.map((r, i) => (
              <li key={i}>
                <span className="font-semibold text-rose-300">[{r.severity.toUpperCase()}]</span>{' '}
                {r.risk}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Limitations / Caveats */}
      {limitations.length > 0 && (
        <div className="bg-amber-950/20 border border-amber-800/30 rounded-lg p-4 space-y-2">
          <div className="flex items-center gap-2 text-amber-400 font-medium text-xs uppercase tracking-wider">
            <AlertTriangle size={14} />
            <span>Analysis Caveats & Data Limitations</span>
          </div>
          <ul className="space-y-1.5 text-xs text-amber-200/80 pl-5 list-disc">
            {limitations.map((lim, i) => (
              <li key={i}>{lim}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
