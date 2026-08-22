/**
 * SalesAgentPage — Phase 9: Specialized Agentic AI Foundation.
 *
 * Dedicated feature page for testing and interacting with the Sales Intelligence Agent.
 * Displays agent identity, capabilities, input query form, structured findings,
 * confidence level, evidence sources, limitations, and execution metadata.
 */

import React, { useState } from 'react';
import { TrendingUp, Shield, AlertCircle, BarChart2 } from 'lucide-react';
import { SalesQueryInput } from './components/SalesQueryInput';
import { SalesFindingsPanel } from './components/SalesFindingsPanel';
import { SalesCitationPanel } from './components/SalesCitationPanel';
import { SalesConfidenceBadge } from './components/SalesConfidenceBadge';
import { SalesLimitationsPanel } from './components/SalesLimitationsPanel';
import { SalesMetadataBar } from './components/SalesMetadataBar';
import { analyzeWithAgent } from '../../../services/agents.api';
import type { AgentResult } from '../../../types/agents';

export const SalesAgentPage: React.FC = () => {
  const [result, setResult] = useState<AgentResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async (query: string, knowledgeBaseId?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await analyzeWithAgent({
        agentId: 'sales',
        query,
        knowledgeBaseId,
      });
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sales Agent analysis failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <TrendingUp size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-100">Sales Intelligence Agent</h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  v1.0.0
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Active Agent
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Specialized Decision Intelligence Agent for sales performance, revenue trends, and period analysis
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
          <Shield size={14} className="text-emerald-400 shrink-0" />
          <span>Tenant Isolated &amp; Grounded</span>
        </div>
      </div>

      {/* Query Input */}
      <SalesQueryInput onSubmit={handleAnalyze} isLoading={isLoading} />

      {/* Error Card */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-800/50 flex items-start gap-3 text-rose-300 text-sm">
          <AlertCircle size={18} className="shrink-0 mt-0.5 text-rose-400" />
          <div className="space-y-1">
            <strong className="font-semibold block text-rose-200">Agent Execution Error</strong>
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* Agent Analysis Results */}
      {result && (
        <div className="space-y-6">
          {/* Summary & Confidence Header */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between gap-4 border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <BarChart2 size={18} className="text-indigo-400" />
                <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
                  Executive Summary
                </h2>
              </div>
              <SalesConfidenceBadge level={result.confidence} />
            </div>

            <p className="text-base text-slate-100 leading-relaxed font-normal">
              {result.summary}
            </p>
          </div>

          {/* Structured Findings */}
          <SalesFindingsPanel findings={result.findings} />

          {/* Caveats & Risks */}
          <SalesLimitationsPanel limitations={result.limitations} risks={result.risks} />

          {/* Evidence Sources */}
          <SalesCitationPanel evidence={result.evidence} />

          {/* Observability Metadata */}
          <SalesMetadataBar metadata={result.metadata} />
        </div>
      )}
    </div>
  );
};
