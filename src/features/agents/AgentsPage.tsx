/**
 * AgentsPage — Phase 10: Multi-Domain Specialized AI Agents.
 *
 * Unified page with domain tab selector for all 6 specialized agents.
 * Replaces the previous single Sales Agent page as the primary agents entry point.
 *
 * Design:
 *   - Sky-blue active tab highlighting
 *   - Domain icon + color per agent
 *   - Shared result display (reuses Phase 9 Sales Agent component patterns)
 *   - Tenant isolated indicator
 *   - Zero regressions: /agents/sales route still works
 */

import React, { useState } from 'react';
import {
  TrendingUp,
  DollarSign,
  Users,
  Package,
  BarChart2,
  ShieldAlert,
  Shield,
  AlertCircle,
  Bot,
  ChevronRight,
} from 'lucide-react';
import { analyzeWithAgent } from '../../services/agents.api';
import type { AgentResult } from '../../types/agents';

// ─── Agent Domain Configuration ───────────────────────────────────────────────

interface AgentDomain {
  id: string;
  label: string;
  icon: React.FC<{ size?: number; className?: string }>;
  description: string;
  iconBgClass: string;
  iconColorClass: string;
  activeBgClass: string;
  activeRingClass: string;
  exampleQuery: string;
}

const AGENT_DOMAINS: AgentDomain[] = [
  {
    id: 'sales',
    label: 'Sales',
    icon: TrendingUp,
    description: 'Sales performance, revenue trends, period comparisons, and regional breakdowns',
    iconBgClass: 'bg-indigo-500/15',
    iconColorClass: 'text-indigo-400',
    activeBgClass: 'bg-indigo-500/20 border-indigo-500/40',
    activeRingClass: 'ring-indigo-500/30',
    exampleQuery: 'What were the sales trends in Q4 2025?',
  },
  {
    id: 'finance',
    label: 'Finance',
    icon: DollarSign,
    description: 'Revenue trends, expense analysis, profit and loss, margins, and cash flow',
    iconBgClass: 'bg-emerald-500/15',
    iconColorClass: 'text-emerald-400',
    activeBgClass: 'bg-emerald-500/20 border-emerald-500/40',
    activeRingClass: 'ring-emerald-500/30',
    exampleQuery: 'What was the gross margin for Q4 2025?',
  },
  {
    id: 'customer',
    label: 'Customer',
    icon: Users,
    description: 'Customer segments, retention, churn indicators, and behavior patterns',
    iconBgClass: 'bg-sky-500/15',
    iconColorClass: 'text-sky-400',
    activeBgClass: 'bg-sky-500/20 border-sky-500/40',
    activeRingClass: 'ring-sky-500/30',
    exampleQuery: 'What is the enterprise customer churn rate?',
  },
  {
    id: 'inventory',
    label: 'Inventory',
    icon: Package,
    description: 'Stock levels, low-stock risk, overstock, inventory turnover, and availability',
    iconBgClass: 'bg-amber-500/15',
    iconColorClass: 'text-amber-400',
    activeBgClass: 'bg-amber-500/20 border-amber-500/40',
    activeRingClass: 'ring-amber-500/30',
    exampleQuery: 'Which products are at risk of stockout?',
  },
  {
    id: 'market',
    label: 'Market',
    icon: BarChart2,
    description: 'Market trends, competitor analysis, industry insights from knowledge base',
    iconBgClass: 'bg-purple-500/15',
    iconColorClass: 'text-purple-400',
    activeBgClass: 'bg-purple-500/20 border-purple-500/40',
    activeRingClass: 'ring-purple-500/30',
    exampleQuery: 'What market trends are visible in our research reports?',
  },
  {
    id: 'risk',
    label: 'Risk',
    icon: ShieldAlert,
    description: 'Cross-domain risk identification, severity classification, and risk assessment',
    iconBgClass: 'bg-rose-500/15',
    iconColorClass: 'text-rose-400',
    activeBgClass: 'bg-rose-500/20 border-rose-500/40',
    activeRingClass: 'ring-rose-500/30',
    exampleQuery: 'What are the highest-severity risks in our current business data?',
  },
];

// ─── Confidence Badge ─────────────────────────────────────────────────────────

function ConfidenceBadge({ level }: { level: string }) {
  const cfg = {
    high: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
    medium: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
    low: 'bg-orange-500/15 text-orange-300 border border-orange-500/30',
    insufficient: 'bg-slate-700/50 text-slate-400 border border-slate-600/50',
  }[level] ?? 'bg-slate-700/50 text-slate-400 border border-slate-600/50';

  return (
    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${cfg}`}>
      {level} confidence
    </span>
  );
}

// ─── Finding Card ─────────────────────────────────────────────────────────────

function FindingCard({
  finding,
  index,
  domain,
}: {
  finding: { finding: string; type: string; citations: string[] };
  index: number;
  domain: AgentDomain;
}) {
  const isInference = finding.type === 'inference';
  return (
    <div className="flex gap-3 p-4 bg-slate-900/60 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors">
      <div className="flex-shrink-0 mt-0.5">
        <span className="text-xs font-mono text-slate-500">{String(index + 1).padStart(2, '0')}</span>
      </div>
      <div className="flex-1 min-w-0 space-y-2">
        <p className="text-sm text-slate-200 leading-relaxed">{finding.finding}</p>
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
              isInference
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                : 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
            }`}
          >
            {isInference ? 'inference' : 'fact'}
          </span>
          {finding.citations.map((c) => (
            <span
              key={c}
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-mono ${domain.iconBgClass} ${domain.iconColorClass} border border-current/20`}
            >
              [{c}]
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Citation Panel ───────────────────────────────────────────────────────────

function CitationPanel({ evidence }: { evidence: AgentResult['evidence'] }) {
  if (!evidence.length) return null;
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Evidence Sources</h3>
      <div className="space-y-2">
        {evidence.map((src) => (
          <div key={src.id} className="p-3 rounded-lg bg-slate-900/40 border border-slate-800">
            <div className="flex items-start gap-2">
              <span className="font-mono text-xs font-bold text-slate-500 mt-0.5 shrink-0">[{src.id}]</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-300 truncate">{src.documentName}</p>
                {src.excerpt && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{src.excerpt}</p>}
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[10px] text-slate-600">
                    Score: {(src.score * 100).toFixed(0)}%
                  </span>
                  {src.pageNumber && (
                    <span className="text-[10px] text-slate-600">· Page {src.pageNumber}</span>
                  )}
                  {src.sheetName && (
                    <span className="text-[10px] text-slate-600">· Sheet: {src.sheetName}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Metadata Bar ─────────────────────────────────────────────────────────────

function MetadataBar({ metadata }: { metadata: AgentResult['metadata'] }) {
  const items = [
    { label: 'Agent', value: metadata.agentId },
    { label: 'Version', value: `v${metadata.agentVersion}` },
    { label: 'Model', value: metadata.model },
    { label: 'Retrieval', value: `${metadata.retrievalTimeMs}ms` },
    { label: 'LLM', value: `${metadata.llmTimeMs}ms` },
    { label: 'Total', value: `${metadata.totalTimeMs}ms` },
    { label: 'Evidence', value: `${metadata.evidenceCount} chunks` },
    ...(metadata.inputTokens !== undefined
      ? [{ label: 'Tokens', value: `${metadata.inputTokens}↑ ${metadata.outputTokens ?? 0}↓` }]
      : []),
  ];

  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1.5 p-3 bg-slate-950/60 rounded-lg border border-slate-800/60">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-1.5 text-[10px]">
          <span className="text-slate-600 uppercase tracking-wider">{item.label}</span>
          <span className="text-slate-400 font-mono">{item.value}</span>
        </div>
      ))}
    </div>
  );
}

// ─── AgentsPage ───────────────────────────────────────────────────────────────

export const AgentsPage: React.FC = () => {
  const [activeDomainId, setActiveDomainId] = useState<string>('finance');
  const [query, setQuery] = useState('');
  const [knowledgeBaseId, setKnowledgeBaseId] = useState('');
  const [result, setResult] = useState<AgentResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeDomain = AGENT_DOMAINS.find((d) => d.id === activeDomainId) ?? AGENT_DOMAINS[0]!;
  const ActiveIcon = activeDomain.icon;

  const handleDomainChange = (domainId: string) => {
    setActiveDomainId(domainId);
    setResult(null);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await analyzeWithAgent({
        agentId: activeDomainId,
        query: query.trim(),
        knowledgeBaseId: knowledgeBaseId.trim() || undefined,
      });
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : `${activeDomain.label} Agent analysis failed.`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* ── Page Header ───────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Bot size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-100">AI Agents</h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  Phase 10
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  6 Agents Active
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Multi-domain Decision Intelligence — grounded in your knowledge base
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
          <Shield size={14} className="text-emerald-400 shrink-0" />
          <span>Tenant Isolated &amp; Evidence-Grounded</span>
        </div>
      </div>

      {/* ── Domain Selector ───────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2">
        {AGENT_DOMAINS.map((domain) => {
          const Icon = domain.icon;
          const isActive = domain.id === activeDomainId;
          return (
            <button
              key={domain.id}
              id={`agent-tab-${domain.id}`}
              onClick={() => handleDomainChange(domain.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium border transition-all duration-150 ${
                isActive
                  ? `${domain.activeBgClass} ${domain.iconColorClass} ring-1 ${domain.activeRingClass}`
                  : 'bg-slate-900/40 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-300'
              }`}
            >
              <Icon size={15} />
              {domain.label}
            </button>
          );
        })}
      </div>

      {/* ── Active Domain Description ─────────────────────────────────────── */}
      <div className={`flex items-start gap-3 p-3.5 rounded-lg border ${activeDomain.activeBgClass}`}>
        <div className={`p-1.5 rounded-lg ${activeDomain.iconBgClass} shrink-0`}>
          <ActiveIcon size={16} className={activeDomain.iconColorClass} />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-200">{activeDomain.label} Intelligence Agent</p>
          <p className="text-xs text-slate-400 mt-0.5">{activeDomain.description}</p>
        </div>
      </div>

      {/* ── Query Form ────────────────────────────────────────────────────── */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-2">
          <label htmlFor="agent-query" className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            Business Question
          </label>
          <div className="relative">
            <textarea
              id="agent-query"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={activeDomain.exampleQuery}
              rows={3}
              maxLength={2000}
              className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-600 resize-none focus:outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/20 transition-all"
            />
            <div className="absolute bottom-2.5 right-3 text-[10px] text-slate-600">
              {query.length}/2000
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <input
              id="agent-kb-id"
              type="text"
              value={knowledgeBaseId}
              onChange={(e) => setKnowledgeBaseId(e.target.value)}
              placeholder="Knowledge Base ID (optional — searches all if omitted)"
              className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-300 placeholder-slate-600 focus:outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/20 transition-all"
            />
          </div>

          <button
            id="agent-analyze-btn"
            type="submit"
            disabled={isLoading || !query.trim()}
            className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${
              isLoading || !query.trim()
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                : `${activeDomain.iconBgClass} ${activeDomain.iconColorClass} border ${activeDomain.activeBgClass} hover:opacity-90`
            }`}
          >
            {isLoading ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Analyzing…
              </>
            ) : (
              <>
                <ActiveIcon size={15} />
                Analyze
                <ChevronRight size={14} />
              </>
            )}
          </button>
        </div>
      </form>

      {/* ── Error State ───────────────────────────────────────────────────── */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-800/50 flex items-start gap-3 text-rose-300 text-sm">
          <AlertCircle size={18} className="shrink-0 mt-0.5 text-rose-400" />
          <div className="space-y-1">
            <strong className="font-semibold block text-rose-200">Agent Execution Error</strong>
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* ── Results ───────────────────────────────────────────────────────── */}
      {result && (
        <div className="space-y-5">
          {/* Summary */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between gap-4 border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <ActiveIcon size={17} className={activeDomain.iconColorClass} />
                <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
                  {activeDomain.label} Intelligence — Executive Summary
                </h2>
              </div>
              <ConfidenceBadge level={result.confidence} />
            </div>
            <p className="text-base text-slate-100 leading-relaxed">{result.summary}</p>
          </div>

          {/* Findings */}
          {result.findings.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Structured Findings ({result.findings.length})
              </h3>
              <div className="space-y-2">
                {result.findings.map((finding, i) => (
                  <FindingCard
                    key={i}
                    finding={finding}
                    index={i}
                    domain={activeDomain}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Risks */}
          {result.risks && result.risks.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Risk Assessment ({result.risks.length})
              </h3>
              <div className="space-y-2">
                {result.risks.map((risk, i) => {
                  const severityStyle = {
                    high: 'border-rose-800/50 bg-rose-950/20',
                    medium: 'border-amber-800/50 bg-amber-950/20',
                    low: 'border-slate-700 bg-slate-900/40',
                  }[risk.severity] ?? 'border-slate-700 bg-slate-900/40';

                  const severityBadge = {
                    high: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
                    medium: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
                    low: 'bg-slate-700/50 text-slate-400 border-slate-600/50',
                  }[risk.severity] ?? 'bg-slate-700/50 text-slate-400 border-slate-600/50';

                  return (
                    <div key={i} className={`p-4 rounded-lg border ${severityStyle}`}>
                      <div className="flex items-start gap-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border shrink-0 mt-0.5 ${severityBadge}`}>
                          {risk.severity}
                        </span>
                        <p className="text-sm text-slate-300 leading-relaxed">{risk.risk}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Limitations */}
          {result.limitations.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Limitations & Caveats</h3>
              <ul className="space-y-1.5">
                {result.limitations.map((limitation, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-400">
                    <span className="text-slate-600 mt-1 shrink-0">·</span>
                    <span>{limitation}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Evidence */}
          <CitationPanel evidence={result.evidence} />

          {/* Observability */}
          <MetadataBar metadata={result.metadata} />
        </div>
      )}
    </div>
  );
};
