/**
 * Documents Module — Types & DTOs.
 */

export interface UpdateDocumentInput {
  displayName?: string;
  knowledgeBaseId?: string | null;
}

export interface DocumentQueryInput {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  fileType?: string;
  knowledgeBaseId?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}
