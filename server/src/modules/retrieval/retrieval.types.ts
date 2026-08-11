/**
 * Retrieval Module Types — Phase 7: RAG Foundation.
 */

import type { ChunkSourceMetadata } from '../../models/document-chunk.model';

export interface SearchEvidenceQueryInput {
  query: string;
  knowledgeBaseId?: string;
  documentId?: string;
  documentVersionId?: string;
  topK?: number;
  minScore?: number;
}

export interface EvidenceResultItem {
  chunkId: string;
  organizationId: string;
  knowledgeBaseId: string | null;
  documentId: string;
  documentVersionId: string;
  documentName?: string;
  chunkIndex: number;
  score: number; // 0.0 – 1.0 cosine similarity score
  text: string;
  metadata: ChunkSourceMetadata;
  embeddingModel: string | null;
}

export interface SearchEvidenceResponseData {
  results: EvidenceResultItem[];
  query: string;
  totalFound: number;
  processingTimeMs: number;
  filtersApplied: {
    organizationId: string;
    knowledgeBaseId?: string;
    documentId?: string;
    documentVersionId?: string;
    topK: number;
    minScore: number;
  };
}
