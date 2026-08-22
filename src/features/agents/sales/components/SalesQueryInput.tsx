/**
 * SalesQueryInput — Phase 9: Sales Intelligence Agent UI.
 *
 * Query form for submitting sales analysis questions to the Sales Agent.
 * Features sample quick-preset prompts and optional Knowledge Base selection.
 */

import React, { useState } from 'react';
import { Sparkles, Database, Loader2, ArrowRight } from 'lucide-react';

interface SalesQueryInputProps {
  onSubmit: (query: string, knowledgeBaseId?: string) => void;
  isLoading: boolean;
}

const SAMPLE_QUERIES = [
  'Why did sales revenue decrease in Q4?',
  'What were our top performing product segments last quarter?',
  'Compare retail vs enterprise channel growth rate.',
  'Identify any sales anomalies reported across regional divisions.',
];

export const SalesQueryInput: React.FC<SalesQueryInputProps> = ({ onSubmit, isLoading }) => {
  const [query, setQuery] = useState('');
  const [knowledgeBaseId, setKnowledgeBaseId] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;
    onSubmit(query.trim(), knowledgeBaseId.trim() || undefined);
  };

  const handlePresetClick = (sample: string) => {
    setQuery(sample);
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4 shadow-xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Sparkles size={18} />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-100">Sales Intelligence Analysis</h2>
            <p className="text-xs text-slate-400">
              Ask any sales, revenue, or period analysis question grounded in your documents
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask the Sales Intelligence Agent (e.g. Why did revenue decline in Q4?)"
            rows={3}
            disabled={isLoading}
            className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl p-3.5 pr-12 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors resize-none disabled:opacity-50"
          />

          <button
            type="submit"
            disabled={!query.trim() || isLoading}
            className="absolute right-3 bottom-3 p-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 disabled:hover:bg-indigo-600 transition-all font-medium text-xs flex items-center justify-center"
            title="Analyze Query"
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
          </button>
        </div>

        {/* Optional Knowledge Base filter */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <Database size={13} className="text-slate-500" />
            <span>Scope to KB ID (optional):</span>
            <input
              type="text"
              value={knowledgeBaseId}
              onChange={(e) => setKnowledgeBaseId(e.target.value)}
              placeholder="All organization KBs"
              disabled={isLoading}
              className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 w-48"
            />
          </div>

          <span className="text-slate-500 font-mono text-[11px]">
            Agent: sales (v1.0.0) | Model: gpt-4o-mini
          </span>
        </div>
      </form>

      {/* Preset Queries */}
      <div className="space-y-2 pt-1 border-t border-slate-800/60">
        <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
          Suggested Analysis Questions:
        </span>
        <div className="flex flex-wrap gap-2">
          {SAMPLE_QUERIES.map((sample, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handlePresetClick(sample)}
              disabled={isLoading}
              className="text-xs bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white px-3 py-1.5 rounded-lg border border-slate-700/50 transition-colors text-left disabled:opacity-50"
            >
              {sample}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
