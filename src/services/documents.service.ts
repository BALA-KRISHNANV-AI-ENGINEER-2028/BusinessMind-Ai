/**
 * Documents Frontend API Client Service.
 */

import { apiClient } from './api.client';
import type { ApiResult } from '../types/api';

export interface DocumentItem {
  id: string;
  organizationId: string;
  knowledgeBaseId?: string | null;
  uploadedBy: string;
  originalFilename: string;
  displayName: string;
  fileType: string;
  mimeType: string;
  fileSize: number;
  storageProvider: 'local' | 'cloudinary';
  storageKey: string;
  checksum: string;
  processingStatus: 'UPLOADING' | 'UPLOADED' | 'VALIDATING' | 'PROCESSING' | 'READY' | 'FAILED' | 'DELETED';
  processingProgress: number;
  processingError?: string | null;
  currentVersion: number;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  fileType?: string;
  knowledgeBaseId?: string;
}

export interface DocumentStatusInfo {
  id: string;
  processingStatus: string;
  processingProgress: number;
  processingError?: string | null;
}

export const documentsService = {
  async getDocuments(params: DocumentQueryParams = {}): Promise<ApiResult<DocumentItem[]>> {
    const queryParts: string[] = [];
    if (params.page) queryParts.push(`page=${params.page}`);
    if (params.pageSize) queryParts.push(`pageSize=${params.pageSize}`);
    if (params.search) queryParts.push(`search=${encodeURIComponent(params.search)}`);
    if (params.status && params.status !== 'all') queryParts.push(`status=${encodeURIComponent(params.status)}`);
    if (params.fileType && params.fileType !== 'all') queryParts.push(`fileType=${encodeURIComponent(params.fileType)}`);
    if (params.knowledgeBaseId) queryParts.push(`knowledgeBaseId=${encodeURIComponent(params.knowledgeBaseId)}`);

    const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
    return apiClient.get<DocumentItem[]>(`/documents${queryString}`);
  },

  async getDocument(id: string): Promise<ApiResult<DocumentItem>> {
    return apiClient.get<DocumentItem>(`/documents/${id}`);
  },

  async uploadFile(file: File, knowledgeBaseId?: string): Promise<ApiResult<DocumentItem>> {
    const formData = new FormData();
    formData.append('file', file);
    if (knowledgeBaseId) {
      formData.append('knowledgeBaseId', knowledgeBaseId);
    }
    return apiClient.uploadFormData<DocumentItem>('/documents', formData);
  },

  async deleteDocument(id: string): Promise<ApiResult<{ message: string }>> {
    return apiClient.delete<{ message: string }>(`/documents/${id}`);
  },

  async getStatus(id: string): Promise<ApiResult<DocumentStatusInfo>> {
    return apiClient.get<DocumentStatusInfo>(`/documents/${id}/status`);
  },

  async reprocessDocument(id: string): Promise<ApiResult<DocumentItem>> {
    return apiClient.post<DocumentItem>(`/documents/${id}/reprocess`);
  },

  getDownloadUrl(id: string): string {
    const baseUrl = (import.meta.env['VITE_API_BASE_URL'] as string) || 'http://localhost:8000/api/v1';
    return `${baseUrl}/documents/${id}/download`;
  },
};
