/**
 * Knowledge Base Frontend API Client Service.
 */

import { apiClient } from './api.client';
import type { ApiResult } from '../types/api';
import { knowledgeCategories } from '../mocks/knowledgeBase.mock';

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

const MOCK_KNOWLEDGE_BASES: KnowledgeBaseItem[] = knowledgeCategories.map((c) => ({
  id: c.id,
  organizationId: 'org_1',
  name: c.name,
  description: c.description,
  isDefault: c.id === '1',
  documentCount: c.documentCount,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}));

export const knowledgeBaseService = {
  async getKnowledgeBases(search?: string): Promise<ApiResult<KnowledgeBaseItem[]>> {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    let filtered = MOCK_KNOWLEDGE_BASES;
    if (search) {
      filtered = filtered.filter((kb) => kb.name.toLowerCase().includes(search.toLowerCase()));
    }
    return apiClient.get<KnowledgeBaseItem[]>(`/knowledge-base${query}`, filtered);
  },

  async getKnowledgeBase(id: string): Promise<ApiResult<KnowledgeBaseItem>> {
    const kb = MOCK_KNOWLEDGE_BASES.find((k) => k.id === id) || MOCK_KNOWLEDGE_BASES[0];
    return apiClient.get<KnowledgeBaseItem>(`/knowledge-base/${id}`, kb);
  },

  async createKnowledgeBase(input: CreateKBInput): Promise<ApiResult<KnowledgeBaseItem>> {
    const newKb: KnowledgeBaseItem = {
      id: `kb_${Date.now()}`,
      organizationId: 'org_1',
      name: input.name,
      description: input.description || '',
      isDefault: input.isDefault || false,
      documentCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return apiClient.post<KnowledgeBaseItem>('/knowledge-base', input, newKb);
  },

  async updateKnowledgeBase(id: string, input: UpdateKBInput): Promise<ApiResult<KnowledgeBaseItem>> {
    const kb = MOCK_KNOWLEDGE_BASES.find((k) => k.id === id) || MOCK_KNOWLEDGE_BASES[0];
    return apiClient.patch<KnowledgeBaseItem>(`/knowledge-base/${id}`, input, { ...kb, ...input });
  },

  async deleteKnowledgeBase(id: string): Promise<ApiResult<{ message: string }>> {
    return apiClient.delete<{ message: string }>(`/knowledge-base/${id}`, { message: 'Knowledge base deleted' });
  },

  async addDocumentToKB(kbId: string, documentId: string): Promise<ApiResult<unknown>> {
    return apiClient.post(`/knowledge-base/${kbId}/documents`, { documentId }, { success: true });
  },

  async removeDocumentFromKB(kbId: string, documentId: string): Promise<ApiResult<unknown>> {
    return apiClient.delete(`/knowledge-base/${kbId}/documents/${documentId}`, { success: true });
  },
};
