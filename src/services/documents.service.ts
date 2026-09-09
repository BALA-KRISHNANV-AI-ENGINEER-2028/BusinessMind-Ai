/**
 * Documents Frontend API Client Service.
 */

import { apiClient } from './api.client';
import type { ApiResult } from '../types/api';
import { allDocuments } from '../mocks/documents.mock';

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

const MOCK_DOCUMENT_ITEMS: DocumentItem[] = allDocuments.map((doc) => ({
  id: doc.id,
  organizationId: 'org_1',
  knowledgeBaseId: '1',
  uploadedBy: doc.uploadedBy || 'Alex Rivera',
  originalFilename: doc.name,
  displayName: doc.name,
  fileType: doc.fileType,
  mimeType: doc.fileType === 'pdf' ? 'application/pdf' : 'application/octet-stream',
  fileSize: 1024 * 1024,
  storageProvider: 'local',
  storageKey: `uploads/${doc.name}`,
  checksum: 'mock-checksum',
  processingStatus: doc.status === 'processed' ? 'READY' : doc.status === 'processing' ? 'PROCESSING' : 'FAILED',
  processingProgress: doc.status === 'processed' ? 100 : 45,
  processingError: doc.status === 'failed' ? 'Failed to extract text from document.' : null,
  currentVersion: 1,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}));

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
    let filtered = MOCK_DOCUMENT_ITEMS;
    if (params.search) {
      filtered = filtered.filter((d) => d.displayName.toLowerCase().includes(params.search!.toLowerCase()));
    }
    return apiClient.get<DocumentItem[]>(`/documents${queryString}`, filtered);
  },

  async getDocument(id: string): Promise<ApiResult<DocumentItem>> {
    const doc = MOCK_DOCUMENT_ITEMS.find((d) => d.id === id) || MOCK_DOCUMENT_ITEMS[0];
    return apiClient.get<DocumentItem>(`/documents/${id}`, doc);
  },

  async uploadFile(file: File, knowledgeBaseId?: string): Promise<ApiResult<DocumentItem>> {
    const mockDoc: DocumentItem = {
      id: `doc_${Date.now()}`,
      organizationId: 'org_1',
      knowledgeBaseId: knowledgeBaseId || '1',
      uploadedBy: 'Alex Rivera',
      originalFilename: file.name,
      displayName: file.name,
      fileType: file.name.split('.').pop() || 'pdf',
      mimeType: file.type || 'application/octet-stream',
      fileSize: file.size,
      storageProvider: 'local',
      storageKey: `uploads/${file.name}`,
      checksum: 'mock-checksum',
      processingStatus: 'READY',
      processingProgress: 100,
      processingError: null,
      currentVersion: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const formData = new FormData();
    formData.append('file', file);
    if (knowledgeBaseId) {
      formData.append('knowledgeBaseId', knowledgeBaseId);
    }
    return apiClient.uploadFormData<DocumentItem>('/documents', formData, mockDoc);
  },

  async deleteDocument(id: string): Promise<ApiResult<{ message: string }>> {
    return apiClient.delete<{ message: string }>(`/documents/${id}`, { message: 'Document deleted' });
  },

  async getStatus(id: string): Promise<ApiResult<DocumentStatusInfo>> {
    return apiClient.get<DocumentStatusInfo>(`/documents/${id}/status`, {
      id,
      processingStatus: 'READY',
      processingProgress: 100,
    });
  },

  async reprocessDocument(id: string): Promise<ApiResult<DocumentItem>> {
    const doc = MOCK_DOCUMENT_ITEMS.find((d) => d.id === id) || MOCK_DOCUMENT_ITEMS[0];
    return apiClient.post<DocumentItem>(`/documents/${id}/reprocess`, undefined, doc);
  },

  getDownloadUrl(id: string): string {
    const baseUrl = (import.meta.env['VITE_API_BASE_URL'] as string) || 'http://localhost:8000/api/v1';
    return `${baseUrl}/documents/${id}/download`;
  },
};
