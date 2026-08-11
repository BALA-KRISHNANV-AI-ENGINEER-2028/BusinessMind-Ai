/**
 * Retrieval Service — Phase 7: RAG Foundation.
 *
 * Implements semantic vector retrieval across document chunks.
 * Multi-Tenant Security Requirement:
 *   Server-side organizationId enforcement. The organizationId is extracted
 *   from the verified JWT in the controller and passed directly to this service.
 *   A user from Organization A can NEVER retrieve chunks belonging to Organization B.
 */

import { documentChunkRepository } from '../../repositories/document-chunk.repository';
import { documentRepository } from '../../repositories/document.repository';
import { embeddingProvider } from '../../services/embedding/embedding.factory';
import { auditLogService } from '../../services/auditLog.service';
import type { SearchEvidenceQueryInput, SearchEvidenceResponseData } from './retrieval.types';
import { config } from '../../config';
import { logger } from '../../config/logger.config';
import { AppError } from '../../errors/AppError';
import { HttpStatus } from '../../constants/http.constants';

export class RetrievalService {
  /**
   * Semantically searches document chunks for evidence matching the input query.
   *
   * Flow:
   *   1. Validate organizationId and query string
   *   2. Generate query vector using EmbeddingService (same model/dimensions as chunks)
   *   3. Perform Atlas Vector Search with mandatory organizationId pre-filter
   *   4. Enrich results with document display names
   *   5. Record security audit log entry
   */
  async searchEvidence(
    organizationId: string,
    userId: string,
    input: SearchEvidenceQueryInput,
  ): Promise<SearchEvidenceResponseData> {
    const startTime = Date.now();

    if (!input.query || input.query.trim().length === 0) {
      throw new AppError('Query string must be non-empty.', HttpStatus.BAD_REQUEST, 'EMPTY_QUERY', true);
    }

    const queryText = input.query.trim();
    const topK = Math.min(input.topK ?? config.rag.retrievalTopK, 20); // enforce max 20
    const minScore = input.minScore ?? config.rag.retrievalMinScore;

    logger.info(
      { organizationId, userId, queryLength: queryText.length, topK, minScore },
      '[RetrievalService] Starting semantic search.',
    );

    // 1. Generate embedding vector for the search query
    let queryVector: number[];
    try {
      queryVector = await embeddingProvider.generateEmbedding(queryText);
    } catch (err) {
      logger.error({ err }, '[RetrievalService] Failed to generate query vector');
      throw new AppError('Failed to generate search embedding.', HttpStatus.INTERNAL_SERVER_ERROR, 'EMBEDDING_FAILED', false);
    }

    // 2. Vector search in repository — organizationId is ALWAYS passed as pre-filter
    const rawResults = await documentChunkRepository.vectorSearch({
      organizationId, // STRICT TENANT ISOLATION
      queryVector,
      topK,
      minScore,
      knowledgeBaseId: input.knowledgeBaseId,
      documentId: input.documentId,
      documentVersionId: input.documentVersionId,
    });

    // 3. Collect unique document IDs to resolve display names
    const uniqueDocIds = Array.from(new Set(rawResults.map((r) => r.documentId)));
    const docNameMap = new Map<string, string>();

    await Promise.all(
      uniqueDocIds.map(async (docId) => {
        const doc = await documentRepository.findByOrgAndId(organizationId, docId);
        if (doc) {
          docNameMap.set(docId, doc.displayName || doc.originalFilename);
        }
      }),
    );

    // 4. Map to evidence results
    const results = rawResults.map((r) => ({
      chunkId: r.chunkId,
      organizationId: r.organizationId,
      knowledgeBaseId: r.knowledgeBaseId,
      documentId: r.documentId,
      documentVersionId: r.documentVersionId,
      documentName: docNameMap.get(r.documentId) ?? 'Unknown Document',
      chunkIndex: r.chunkIndex,
      score: Math.round(r.score * 10000) / 10000, // round to 4 decimal places
      text: r.text,
      metadata: r.metadata,
      embeddingModel: r.embeddingModel,
    }));

    const processingTimeMs = Date.now() - startTime;

    await auditLogService.log({
      organizationId,
      userId,
      action: 'rag:retrieval:search',
      resource: 'retrieval',
      details: {
        queryLength: queryText.length,
        resultsReturned: results.length,
        processingTimeMs,
        knowledgeBaseId: input.knowledgeBaseId ?? null,
      },
    });

    logger.info(
      { organizationId, userId, resultsCount: results.length, processingTimeMs },
      `[RetrievalService] Semantic search completed in ${processingTimeMs}ms with ${results.length} results.`,
    );

    return {
      results,
      query: queryText,
      totalFound: results.length,
      processingTimeMs,
      filtersApplied: {
        organizationId,
        knowledgeBaseId: input.knowledgeBaseId,
        documentId: input.documentId,
        documentVersionId: input.documentVersionId,
        topK,
        minScore,
      },
    };
  }
}

export const retrievalService = new RetrievalService();
