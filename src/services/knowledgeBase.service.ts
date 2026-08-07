/**
 * Knowledge Base Frontend API Client Service.
 */

import { apiClient } from './api.client';
import type { ApiResult } from '../types/api';

export interface KnowledgeBaseItem {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  isDefault: boolean;
  documentCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateKBInput {
  name: string;
  description?: string;
  isDefault?: boolean;
}

export interface UpdateKBInput {
  name?: string;
  description?: string;
  isDefault?: boolean;
}

export const knowledgeBaseService = {
  async getKnowledgeBases(search?: string): Promise<ApiResult<KnowledgeBaseItem[]>> {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    return apiClient.get<KnowledgeBaseItem[]>(`/knowledge-base${query}`);
  },

  async getKnowledgeBase(id: string): Promise<ApiResult<KnowledgeBaseItem>> {
    return apiClient.get<KnowledgeBaseItem>(`/knowledge-base/${id}`);
  },

  async createKnowledgeBase(input: CreateKBInput): Promise<ApiResult<KnowledgeBaseItem>> {
    return apiClient.post<KnowledgeBaseItem>('/knowledge-base', input);
  },

  async updateKnowledgeBase(id: string, input: UpdateKBInput): Promise<ApiResult<KnowledgeBaseItem>> {
    return apiClient.patch<KnowledgeBaseItem>(`/knowledge-base/${id}`, input);
  },

  async deleteKnowledgeBase(id: string): Promise<ApiResult<{ message: string }>> {
    return apiClient.delete<{ message: string }>(`/knowledge-base/${id}`);
  },

  async addDocumentToKB(kbId: string, documentId: string): Promise<ApiResult<unknown>> {
    return apiClient.post(`/knowledge-base/${kbId}/documents`, { documentId });
  },

  async removeDocumentFromKB(kbId: string, documentId: string): Promise<ApiResult<unknown>> {
    return apiClient.delete(`/knowledge-base/${kbId}/documents/${documentId}`);
  },
};
