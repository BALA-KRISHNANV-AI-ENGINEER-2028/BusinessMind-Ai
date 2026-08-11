/**
 * DocumentChunk Mongoose Model — Phase 7: RAG Foundation.
 *
 * Each chunk represents a segment of extracted document text that has been:
 *   1. Split from the full document text by ChunkingService
 *   2. Assigned an embedding by EmbeddingService
 *   3. Indexed for vector similarity search via MongoDB Atlas Vector Search
 *
 * Multi-tenant isolation: every query MUST include organizationId as a filter.
 * Idempotency key: (documentVersionId + chunkIndex) — unique compound index.
 */

import mongoose, { Schema, Document, Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

// ─── Embedding Status ─────────────────────────────────────────────────────────

export const CHUNK_EMBEDDING_STATUS = {
  /** Chunk created, embedding not yet requested. */
  PENDING: 'PENDING',
  /** Embedding request in flight. */
  PROCESSING: 'PROCESSING',
  /** Embedding stored, chunk is retrieval-ready. */
  COMPLETED: 'COMPLETED',
  /** Embedding failed — see embeddingError for details. */
  FAILED: 'FAILED',
} as const;

export type ChunkEmbeddingStatus =
  (typeof CHUNK_EMBEDDING_STATUS)[keyof typeof CHUNK_EMBEDDING_STATUS];

// ─── Chunk Source Metadata ────────────────────────────────────────────────────

/**
 * Source-document structural metadata preserved for future evidence citations.
 * All fields optional — only available when the source document type supports them.
 */
export interface ChunkSourceMetadata {
  /** PDF page number (1-based). */
  pageNumber?: number;
  /** XLSX sheet name. */
  sheetName?: string;
  /** TXT/Markdown section heading detected above this chunk. */
  sectionHeading?: string;
  /** Character offset where this chunk starts in the full extractedText. */
  startOffset: number;
  /** Character offset where this chunk ends in the full extractedText. */
  endOffset: number;
}

// ─── Document Interface ───────────────────────────────────────────────────────

export interface IDocumentChunkDocument extends Document<string> {
  _id: string;

  // ─── Tenant + Source Traceability ──────────────────────────────────────────
  organizationId: string;
  knowledgeBaseId: string | null;
  documentId: string;
  documentVersionId: string;
  chunkIndex: number;

  // ─── Chunk Content ─────────────────────────────────────────────────────────
  text: string;
  tokenCount: number;
  characterCount: number;
  metadata: ChunkSourceMetadata;

  // ─── Embedding ─────────────────────────────────────────────────────────────
  embedding: number[] | null;
  embeddingModel: string | null;
  embeddingDimensions: number | null;
  embeddingStatus: ChunkEmbeddingStatus;
  embeddingError: string | null;

  createdAt: Date;
  updatedAt: Date;
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const ChunkSourceMetadataSchema = new Schema<ChunkSourceMetadata>(
  {
    pageNumber: { type: Number, default: undefined },
    sheetName: { type: String, default: undefined },
    sectionHeading: { type: String, default: undefined },
    startOffset: { type: Number, required: true, default: 0 },
    endOffset: { type: Number, required: true, default: 0 },
  },
  { _id: false },
);

const DocumentChunkSchema = new Schema<IDocumentChunkDocument>(
  {
    _id: {
      type: String,
      default: () => uuidv4(),
    },

    // ─── Tenant + Source Traceability ────────────────────────────────────────
    organizationId: {
      type: String,
      ref: 'Organization',
      required: true,
      index: true,
    },
    knowledgeBaseId: {
      type: String,
      ref: 'KnowledgeBase',
      default: null,
      index: true,
    },
    documentId: {
      type: String,
      ref: 'Document',
      required: true,
      index: true,
    },
    documentVersionId: {
      type: String,
      ref: 'DocumentVersion',
      required: true,
      index: true,
    },
    chunkIndex: {
      type: Number,
      required: true,
      min: 0,
    },

    // ─── Chunk Content ───────────────────────────────────────────────────────
    text: {
      type: String,
      required: true,
      minlength: 1,
    },
    tokenCount: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    characterCount: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    metadata: {
      type: ChunkSourceMetadataSchema,
      required: true,
      default: () => ({ startOffset: 0, endOffset: 0 }),
    },

    // ─── Embedding ───────────────────────────────────────────────────────────
    /**
     * The dense vector embedding for this chunk.
     * Stored as a flat number[] — MongoDB Atlas Vector Search reads this field
     * via the "document_chunk_vector_index" index (numDimensions: 1536).
     *
     * NOTE: This field is intentionally NOT indexed via a standard Mongoose index.
     * The Atlas Vector Search index is created separately in the Atlas UI/API.
     */
    embedding: {
      type: [Number],
      default: null,
    },
    embeddingModel: {
      type: String,
      default: null,
    },
    embeddingDimensions: {
      type: Number,
      default: null,
    },
    embeddingStatus: {
      type: String,
      required: true,
      enum: Object.values(CHUNK_EMBEDDING_STATUS),
      default: CHUNK_EMBEDDING_STATUS.PENDING,
      index: true,
    },
    embeddingError: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, unknown>) => {
        ret['id'] = ret['_id'];
        delete ret['_id'];
        delete ret['__v'];
        // Never expose raw embedding vector in JSON responses
        delete ret['embedding'];
        return ret;
      },
    },
  },
);

// ─── Indexes ─────────────────────────────────────────────────────────────────

/**
 * PRIMARY IDEMPOTENCY INDEX:
 * Ensures exactly one chunk per (documentVersionId, chunkIndex) within an org.
 * Used by bulkUpsert to prevent duplicate chunks on reprocessing.
 */
DocumentChunkSchema.index(
  { organizationId: 1, documentVersionId: 1, chunkIndex: 1 },
  { unique: true },
);

/** Query: all chunks for a document (pagination, listing). */
DocumentChunkSchema.index({ organizationId: 1, documentId: 1, chunkIndex: 1 });

/** Query: all chunks in a knowledge base (KB-level stats). */
DocumentChunkSchema.index({ organizationId: 1, knowledgeBaseId: 1, embeddingStatus: 1 });

/** Query: pending/failed chunks for the embedding pipeline. */
DocumentChunkSchema.index({ embeddingStatus: 1, organizationId: 1 });

// ─── Model ───────────────────────────────────────────────────────────────────

export const DocumentChunkModel: Model<IDocumentChunkDocument> =
  mongoose.models['DocumentChunk'] ||
  mongoose.model<IDocumentChunkDocument>('DocumentChunk', DocumentChunkSchema);
