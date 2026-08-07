/**
 * Knowledge Base Module — Type Definitions & DTOs.
 */

export interface CreateKnowledgeBaseInput {
  name: string;
  description?: string;
  isDefault?: boolean;
}

export interface UpdateKnowledgeBaseInput {
  name?: string;
  description?: string;
  isDefault?: boolean;
}

export interface AddDocumentToKBInput {
  documentId: string;
}

export interface KnowledgeBaseQueryInput {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}
