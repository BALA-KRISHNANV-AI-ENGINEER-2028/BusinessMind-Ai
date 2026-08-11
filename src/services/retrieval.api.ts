/**
 * Retrieval API Client — Frontend Service.
 *
 * Calls POST /api/v1/retrieval/search with mock fallback for offline dev.
 */

import { apiClient } from './api.client';

export interface SearchEvidenceParams {
  query: string;
  knowledgeBaseId?: string;
  documentId?: string;
  topK?: number;
  minScore?: number;
}

export interface ChunkMetadata {
  pageNumber?: number;
  sheetName?: string;
  sectionHeading?: string;
  startOffset: number;
  endOffset: number;
}

export interface EvidenceItem {
  chunkId: string;
  organizationId: string;
  knowledgeBaseId: string | null;
  documentId: string;
  documentVersionId: string;
  documentName: string;
  chunkIndex: number;
  score: number;
  text: string;
  metadata: ChunkMetadata;
  embeddingModel: string | null;
}

export interface RetrievalSearchResponse {
  results: EvidenceItem[];
  query: string;
  totalFound: number;
  processingTimeMs: number;
  filtersApplied: {
    organizationId: string;
    knowledgeBaseId?: string;
    documentId?: string;
    topK: number;
    minScore: number;
  };
}

const MOCK_RETRIEVAL_RESPONSE: RetrievalSearchResponse = {
  results: [
    {
      chunkId: 'chunk-demo-1',
      organizationId: 'org-demo',
      knowledgeBaseId: 'kb-demo',
      documentId: 'doc-demo-1',
      documentVersionId: 'v1',
      documentName: 'Q3_Financial_Analysis.pdf',
      chunkIndex: 0,
      score: 0.8942,
      text: 'BusinessMind AI achieved strong growth in enterprise subscriptions during Q3. Revenue increased by 35% quarter-over-quarter driven by adoption of decision intelligence.',
      metadata: {
        pageNumber: 2,
        sectionHeading: 'Executive Summary',
        startOffset: 120,
        endOffset: 310,
      },
      embeddingModel: 'text-embedding-3-small',
    },
    {
      chunkId: 'chunk-demo-2',
      organizationId: 'org-demo',
      knowledgeBaseId: 'kb-demo',
      documentId: 'doc-demo-2',
      documentVersionId: 'v1',
      documentName: 'Enterprise_Product_Roadmap.docx',
      chunkIndex: 3,
      score: 0.7815,
      text: 'Phase 7 delivers vector search capability over document chunks using MongoDB Atlas Vector Search and 1536-dimensional OpenAI embeddings.',
      metadata: {
        sectionHeading: 'Phase 7 Architecture',
        startOffset: 450,
        endOffset: 620,
      },
      embeddingModel: 'text-embedding-3-small',
    },
  ],
  query: 'Quarterly financial revenue growth',
  totalFound: 2,
  processingTimeMs: 142,
  filtersApplied: {
    organizationId: 'org-demo',
    topK: 5,
    minScore: 0.7,
  },
};

export async function searchEvidence(
  params: SearchEvidenceParams,
): Promise<RetrievalSearchResponse> {
  const result = await apiClient.post<RetrievalSearchResponse>(
    '/retrieval/search',
    params,
    MOCK_RETRIEVAL_RESPONSE,
  );
  if (!result.success) {
    throw new Error(result.message || 'Retrieval search failed');
  }
  return result.data;
}
