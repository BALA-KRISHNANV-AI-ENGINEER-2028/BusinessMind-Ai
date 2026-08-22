/**
 * SalesMetadataBar — Phase 9: Sales Intelligence Agent UI.
 *
 * Observability bar showing timing metrics, evidence count, model, prompt version.
 */

import React from 'react';
import { Clock, Database, Cpu, FileText, Activity } from 'lucide-react';
import type { AgentExecutionMetadata } from '../../../../types/agents';

interface SalesMetadataBarProps {
  metadata: AgentExecutionMetadata;
}

export const SalesMetadataBar: React.FC<SalesMetadataBarProps> = ({ metadata }) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 bg-slate-900/60 border border-slate-800 rounded-lg p-3">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-1.5" title="Total Execution Time">
          <Clock size={13} className="text-indigo-400" />
          <span>
            Total: <strong className="text-slate-200">{metadata.totalTimeMs}ms</strong>
          </span>
          <span className="text-slate-600">
            ({metadata.retrievalTimeMs}ms ret + {metadata.llmTimeMs}ms llm)
          </span>
        </div>

        <div className="flex items-center gap-1.5" title="Evidence Chunks">
          <Database size={13} className="text-emerald-400" />
          <span>
            Evidence: <strong className="text-slate-200">{metadata.evidenceCount}</strong> retrieved
          </span>
          <span className="text-slate-600">({metadata.chunksInContext} in context)</span>
        </div>

        <div className="flex items-center gap-1.5" title="AI Model">
          <Cpu size={13} className="text-cyan-400" />
          <span>
            Model: <strong className="text-slate-200">{metadata.model}</strong>
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 text-slate-500">
        <div className="flex items-center gap-1">
          <FileText size={12} />
          <span>Prompt: {metadata.promptVersion.replace('SALES_AGENT_SYSTEM_PROMPT_', '')}</span>
        </div>
        <div className="flex items-center gap-1">
          <Activity size={12} />
          <span>v{metadata.agentVersion}</span>
        </div>
      </div>
    </div>
  );
};
