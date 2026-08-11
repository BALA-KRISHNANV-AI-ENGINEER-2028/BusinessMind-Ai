/**
 * Retrieval Page — Phase 7: RAG Foundation Developer/Admin UI.
 *
 * Provides a dedicated interface to test vector retrieval across organization documents.
 * Displays retrieved evidence chunks with similarity score breakdown, source metadata,
 * execution timing, and applied filters.
 */

import React, { useState } from 'react';
import { SearchBar } from './components/SearchBar';
import { EvidenceResultCard } from './components/EvidenceResultCard';
import { searchEvidence } from '../../services/retrieval.api';
import type { RetrievalSearchResponse } from '../../services/retrieval.api';
import { Layers, Zap, AlertCircle, Database } from 'lucide-react';

export const RetrievalPage: React.FC = () => {
  const [data, setData] = useState<RetrievalSearchResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (query: string, topK: number, minScore: number) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await searchEvidence({ query, topK, minScore });
      setData(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold tracking-wide bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase">
              Phase 7 — RAG Foundation
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Layers className="w-6 h-6 text-indigo-400" />
            Semantic Evidence Retrieval
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Test vector similarity search over document chunks via MongoDB Atlas Vector Search
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <SearchBar onSearch={handleSearch} isLoading={isLoading} />

      {/* Error Alert */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3 text-red-400 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Results Section */}
      {data && (
        <div className="space-y-4">
          {/* Results Summary Bar */}
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-400" />
              <span>Found <strong className="text-slate-200">{data.totalFound}</strong> evidence chunk(s)</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-500">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Query processed in <strong className="text-slate-300">{data.processingTimeMs}ms</strong></span>
            </div>
          </div>

          {/* Results List */}
          {data.results.length === 0 ? (
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-8 text-center text-slate-400 space-y-2">
              <p className="font-medium text-slate-300">No matching evidence found</p>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                No chunks matched the query with similarity &ge; {data.filtersApplied.minScore}. Try lowering the minimum similarity score or adjusting your search keywords.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.results.map((evidence, idx) => (
                <EvidenceResultCard key={evidence.chunkId || idx} evidence={evidence} rank={idx + 1} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RetrievalPage;
