/**
 * Knowledge Base Module — Types.
 * Prepared for RAG integration in Phase 6+.
 */

import type { ISODateString } from '../../types/common.types';

export type KnowledgeItemStatus = 'active' | 'archived' | 'indexing';

export interface KnowledgeItem {
  id: string;
  organizationId: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  sourceDocumentId?: string; // Links to a Document
  status: KnowledgeItemStatus;
  // Phase 6+ (RAG): vectorEmbedding, chunkIds, vectorStoreId
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface CreateKnowledgeItemDto {
  title: string;
  content: string;
  category?: string;
  tags?: string[];
  sourceDocumentId?: string;
}

export interface UpdateKnowledgeItemDto {
  title?: string;
  content?: string;
  category?: string;
  tags?: string[];
  status?: KnowledgeItemStatus;
}
