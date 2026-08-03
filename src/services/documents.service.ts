import { apiClient } from './api.client';
import type { ApiResult } from '../types/api';
import type { DocumentSummary } from '../types/business';
import { allDocuments } from '../mocks/documents.mock';

export const documentsService = {
  async getDocuments(): Promise<ApiResult<DocumentSummary[]>> {
    return apiClient.get(allDocuments);
  },

  async uploadDocuments(files: File[]): Promise<ApiResult<DocumentSummary[]>> {
    const newDocs: DocumentSummary[] = files.map((file, index) => ({
      id: `doc_new_${Date.now()}_${index}`,
      name: file.name,
      updatedLabel: 'Just now',
      fileType: file.name.split('.').pop() ?? 'file',
      status: 'processing',
      sizeLabel: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      uploadedBy: 'Alex Rivera',
    }));
    return apiClient.post(newDocs);
  },

  async deleteDocument(id: string): Promise<ApiResult<{ id: string }>> {
    return apiClient.delete({ id });
  },
};
