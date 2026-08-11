/**
 * DocumentChunk Repository — Phase 7: RAG Foundation.
 *
 * Provides CRUD operations and vector similarity search for DocumentChunk documents.
 * Multi-tenant isolation is enforced at repository level: every method that reads
 * data requires organizationId and always scopes queries by it.
 *
 * Key methods:
 *   bulkUpsert()    — idempotent chunk ingestion (insert or update by version+index)
 *   vectorSearch()  — MongoDB Atlas Vector Search with mandatory org/KB filtering
 *   deleteByDocumentVersion() — clean old chunks before reprocessing a new version
 */

import { BaseRepository } from './base.repository';
import {
  DocumentChunkModel,
  IDocumentChunkDocument,
  CHUNK_EMBEDDING_STATUS,
  ChunkEmbeddingStatus,
  ChunkSourceMetadata,
} from '../models/document-chunk.model';
import type { FilterQuery } from 'mongoose';

// ─── Entity Types ─────────────────────────────────────────────────────────────

export interface ChunkEntity {
  id: string;
  organizationId: string;
  knowledgeBaseId: string | null;
  documentId: string;
  documentVersionId: string;
  chunkIndex: number;
  text: string;
  tokenCount: number;
  characterCount: number;
  metadata: ChunkSourceMetadata;
  embeddingModel: string | null;
  embeddingDimensions: number | null;
  embeddingStatus: ChunkEmbeddingStatus;
  embeddingError: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateChunkDto {
  organizationId: string;
  knowledgeBaseId: string | null;
  documentId: string;
  documentVersionId: string;
  chunkIndex: number;
  text: string;
  tokenCount: number;
  characterCount: number;
  metadata: ChunkSourceMetadata;
}

export type UpdateChunkDto = Partial<
  Omit<ChunkEntity, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'>
>;

export interface VectorSearchResult {
  chunkId: string;
  organizationId: string;
  knowledgeBaseId: string | null;
  documentId: string;
  documentVersionId: string;
  chunkIndex: number;
  text: string;
  metadata: ChunkSourceMetadata;
  embeddingModel: string | null;
  score: number;
}

export interface VectorSearchParams {
  /** MANDATORY — enforced for multi-tenant isolation. */
  organizationId: string;
  queryVector: number[];
  topK: number;
  /** Minimum cosine similarity score (0–1). Chunks below this are excluded. */
  minScore: number;
  /** Optional — scope search to a specific knowledge base. */
  knowledgeBaseId?: string;
  /** Optional — scope search to a specific document. */
  documentId?: string;
  /** Optional — scope search to a specific document version. */
  documentVersionId?: string;
}

export interface ChunkStatsResult {
  total: number;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
}

// ─── Repository ───────────────────────────────────────────────────────────────

export class DocumentChunkRepository extends BaseRepository<
  IDocumentChunkDocument,
  ChunkEntity,
  CreateChunkDto,
  UpdateChunkDto
> {
  constructor() {
    super(DocumentChunkModel);
  }

  // ─── Entity Mapper ──────────────────────────────────────────────────────────

  protected toEntity(doc: IDocumentChunkDocument): ChunkEntity {
    const json = doc.toJSON() as Record<string, unknown>;
    return {
      id: String(json['id'] ?? json['_id']),
      organizationId: String(json['organizationId']),
      knowledgeBaseId: json['knowledgeBaseId'] ? String(json['knowledgeBaseId']) : null,
      documentId: String(json['documentId']),
      documentVersionId: String(json['documentVersionId']),
      chunkIndex: Number(json['chunkIndex']),
      text: String(json['text']),
      tokenCount: Number(json['tokenCount'] ?? 0),
      characterCount: Number(json['characterCount'] ?? 0),
      metadata: (json['metadata'] as ChunkSourceMetadata) ?? { startOffset: 0, endOffset: 0 },
      embeddingModel: json['embeddingModel'] ? String(json['embeddingModel']) : null,
      embeddingDimensions: json['embeddingDimensions'] ? Number(json['embeddingDimensions']) : null,
      embeddingStatus: (json['embeddingStatus'] as ChunkEmbeddingStatus) ?? CHUNK_EMBEDDING_STATUS.PENDING,
      embeddingError: json['embeddingError'] ? String(json['embeddingError']) : null,
      createdAt: json['createdAt'] ? new Date(json['createdAt'] as string).toISOString() : new Date().toISOString(),
      updatedAt: json['updatedAt'] ? new Date(json['updatedAt'] as string).toISOString() : new Date().toISOString(),
    };
  }

  // ─── Idempotent Bulk Upsert ──────────────────────────────────────────────────

  /**
   * Inserts or updates chunks for a document version.
   * Idempotency key: (organizationId, documentVersionId, chunkIndex).
   * Running this twice produces exactly the same set of chunks.
   * Resets embeddingStatus to PENDING so embeddings are regenerated.
   */
  async bulkUpsert(chunks: CreateChunkDto[]): Promise<void> {
    if (chunks.length === 0) return;

    const operations = chunks.map((chunk) => ({
      updateOne: {
        filter: {
          organizationId: chunk.organizationId,
          documentVersionId: chunk.documentVersionId,
          chunkIndex: chunk.chunkIndex,
        },
        update: {
          $set: {
            ...chunk,
            // Reset embedding state — a new upsert means embeddings must be regenerated
            embedding: null,
            embeddingModel: null,
            embeddingDimensions: null,
            embeddingStatus: CHUNK_EMBEDDING_STATUS.PENDING,
            embeddingError: null,
          },
          $setOnInsert: {
            _id: require('uuid').v4(),
          },
        },
        upsert: true,
      },
    }));

    await this.model.bulkWrite(operations, { ordered: false });
  }

  // ─── Find Chunks by Document ─────────────────────────────────────────────────

  async findByDocument(
    organizationId: string,
    documentId: string,
    page = 1,
    pageSize = 50,
  ): Promise<{ chunks: ChunkEntity[]; total: number }> {
    const skip = (page - 1) * pageSize;
    const filter: FilterQuery<IDocumentChunkDocument> = { organizationId, documentId };

    const [docs, total] = await Promise.all([
      this.model.find(filter).sort({ chunkIndex: 1 }).skip(skip).limit(pageSize).exec(),
      this.model.countDocuments(filter).exec(),
    ]);

    return { chunks: docs.map((d) => this.toEntity(d)), total };
  }

  // ─── Find Pending Chunks for Embedding Pipeline ───────────────────────────────

  /**
   * Returns chunks that have not yet been embedded (or failed embedding).
   * Used by the embedding pipeline to pick up work.
   */
  async findPendingByDocumentVersion(
    organizationId: string,
    documentVersionId: string,
  ): Promise<ChunkEntity[]> {
    const docs = await this.model
      .find({
        organizationId,
        documentVersionId,
        embeddingStatus: {
          $in: [CHUNK_EMBEDDING_STATUS.PENDING, CHUNK_EMBEDDING_STATUS.FAILED],
        },
      })
      .sort({ chunkIndex: 1 })
      .exec();

    return docs.map((d) => this.toEntity(d));
  }

  // ─── Update Embedding for a Single Chunk ─────────────────────────────────────

  /**
   * Stores the generated embedding vector for a specific chunk.
   * Also validates dimension count matches the expected dimensions.
   */
  async updateEmbedding(
    chunkId: string,
    embedding: number[],
    model: string,
    dimensions: number,
  ): Promise<void> {
    if (embedding.length !== dimensions) {
      throw new Error(
        `Embedding dimension mismatch: expected ${dimensions}, got ${embedding.length} for chunk ${chunkId}.`,
      );
    }

    await this.model.findByIdAndUpdate(chunkId, {
      $set: {
        embedding,
        embeddingModel: model,
        embeddingDimensions: dimensions,
        embeddingStatus: CHUNK_EMBEDDING_STATUS.COMPLETED,
        embeddingError: null,
      },
    });
  }

  // ─── Mark Embedding Failed ───────────────────────────────────────────────────

  async markEmbeddingFailed(chunkId: string, errorMessage: string): Promise<void> {
    await this.model.findByIdAndUpdate(chunkId, {
      $set: {
        embeddingStatus: CHUNK_EMBEDDING_STATUS.FAILED,
        embeddingError: errorMessage.slice(0, 500), // cap error message length
      },
    });
  }

  // ─── Delete by Document Version (for reprocessing) ───────────────────────────

  /**
   * Hard-deletes all chunks for a given document version.
   * Called before re-chunking so the new version's chunks replace old ones.
   * Protected by organizationId — cannot delete across tenant boundaries.
   */
  async deleteByDocumentVersion(
    organizationId: string,
    documentVersionId: string,
  ): Promise<number> {
    const result = await this.model.deleteMany({
      organizationId,
      documentVersionId,
    });
    return result.deletedCount ?? 0;
  }

  // ─── Stats per Knowledge Base ─────────────────────────────────────────────────

  async getStatsByKnowledgeBase(
    organizationId: string,
    knowledgeBaseId: string,
  ): Promise<ChunkStatsResult> {
    const results = await this.model.aggregate<{
      _id: ChunkEmbeddingStatus;
      count: number;
    }>([
      { $match: { organizationId, knowledgeBaseId } },
      { $group: { _id: '$embeddingStatus', count: { $sum: 1 } } },
    ]);

    const stats: ChunkStatsResult = { total: 0, pending: 0, processing: 0, completed: 0, failed: 0 };

    for (const { _id, count } of results) {
      stats.total += count;
      if (_id === CHUNK_EMBEDDING_STATUS.PENDING) stats.pending = count;
      if (_id === CHUNK_EMBEDDING_STATUS.PROCESSING) stats.processing = count;
      if (_id === CHUNK_EMBEDDING_STATUS.COMPLETED) stats.completed = count;
      if (_id === CHUNK_EMBEDDING_STATUS.FAILED) stats.failed = count;
    }

    return stats;
  }

  // ─── Stats per Document ───────────────────────────────────────────────────────

  async getStatsByDocument(
    organizationId: string,
    documentId: string,
  ): Promise<ChunkStatsResult & { documentId: string }> {
    const results = await this.model.aggregate<{
      _id: ChunkEmbeddingStatus;
      count: number;
    }>([
      { $match: { organizationId, documentId } },
      { $group: { _id: '$embeddingStatus', count: { $sum: 1 } } },
    ]);

    const stats: ChunkStatsResult & { documentId: string } = {
      documentId,
      total: 0,
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
    };

    for (const { _id, count } of results) {
      stats.total += count;
      if (_id === CHUNK_EMBEDDING_STATUS.PENDING) stats.pending = count;
      if (_id === CHUNK_EMBEDDING_STATUS.PROCESSING) stats.processing = count;
      if (_id === CHUNK_EMBEDDING_STATUS.COMPLETED) stats.completed = count;
      if (_id === CHUNK_EMBEDDING_STATUS.FAILED) stats.failed = count;
    }

    return stats;
  }

  // ─── Vector Search ───────────────────────────────────────────────────────────

  /**
   * Performs MongoDB Atlas Vector Search for semantically similar chunks.
   *
   * SECURITY REQUIREMENT: `organizationId` is ALWAYS included in the filter.
   * Cross-tenant search is impossible via this method — the filter is built
   * server-side from the authenticated user's JWT payload, never from client input.
   *
   * Requires the Atlas Vector Search index "document_chunk_vector_index" to be
   * created on the `documentchunks` collection (see ATLAS_VECTOR_INDEX.md).
   */
  async vectorSearch(params: VectorSearchParams): Promise<VectorSearchResult[]> {
    const { organizationId, queryVector, topK, minScore, knowledgeBaseId, documentId, documentVersionId } = params;

    // Build the Atlas Vector Search pre-filter
    // Only COMPLETED embeddings can be retrieved
    const preFilter: Record<string, unknown> = {
      organizationId: { $eq: organizationId },
      embeddingStatus: { $eq: CHUNK_EMBEDDING_STATUS.COMPLETED },
    };

    if (knowledgeBaseId) {
      preFilter['knowledgeBaseId'] = { $eq: knowledgeBaseId };
    }
    if (documentId) {
      preFilter['documentId'] = { $eq: documentId };
    }
    if (documentVersionId) {
      preFilter['documentVersionId'] = { $eq: documentVersionId };
    }

    const pipeline = [
      {
        $vectorSearch: {
          index: 'document_chunk_vector_index',
          path: 'embedding',
          queryVector,
          numCandidates: Math.min(topK * 10, 1000), // overfetch for reranking
          limit: topK,
          filter: preFilter,
        },
      },
      {
        $addFields: {
          score: { $meta: 'vectorSearchScore' },
        },
      },
      // Apply minimum score threshold after vector search
      {
        $match: {
          score: { $gte: minScore },
        },
      },
      {
        $project: {
          _id: 1,
          organizationId: 1,
          knowledgeBaseId: 1,
          documentId: 1,
          documentVersionId: 1,
          chunkIndex: 1,
          text: 1,
          metadata: 1,
          embeddingModel: 1,
          score: 1,
          // Never project embedding vector — unnecessary data transfer
          embedding: 0,
        },
      },
    ];

    const rawResults = await this.model.aggregate(pipeline).exec();

    return rawResults.map((r: Record<string, unknown>) => ({
      chunkId: String(r['_id']),
      organizationId: String(r['organizationId']),
      knowledgeBaseId: r['knowledgeBaseId'] ? String(r['knowledgeBaseId']) : null,
      documentId: String(r['documentId']),
      documentVersionId: String(r['documentVersionId']),
      chunkIndex: Number(r['chunkIndex']),
      text: String(r['text']),
      metadata: (r['metadata'] as ChunkSourceMetadata) ?? { startOffset: 0, endOffset: 0 },
      embeddingModel: r['embeddingModel'] ? String(r['embeddingModel']) : null,
      score: Number(r['score']),
    }));
  }

  // ─── Count All Embedded Chunks for a Document Version ─────────────────────────

  async countCompletedByDocumentVersion(
    organizationId: string,
    documentVersionId: string,
  ): Promise<number> {
    return this.model.countDocuments({
      organizationId,
      documentVersionId,
      embeddingStatus: CHUNK_EMBEDDING_STATUS.COMPLETED,
    });
  }
}

export const documentChunkRepository = new DocumentChunkRepository();
