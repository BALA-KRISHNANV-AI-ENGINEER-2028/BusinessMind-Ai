/**
 * Documents Module — Types.
 * Mirrors the frontend DocumentSummary and DocumentStatus types.
 */

import type { ISODateString } from '../../types/common.types';
import type { DocumentStatus } from '../../constants/app.constants';

export interface Document {
  id: string;
  organizationId: string;
  name: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  sizeLabel: string;
  fileType: string;
  status: DocumentStatus;
  category?: string;
  tags: string[];
  uploadedBy: string;
  storageKey: string; // Cloud storage key — prepared for Phase 5
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface CreateDocumentDto {
  organizationId: string;
  name: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  storageKey: string;
  category?: string;
  tags?: string[];
}

export interface UpdateDocumentDto {
  name?: string;
  category?: string;
  tags?: string[];
}
