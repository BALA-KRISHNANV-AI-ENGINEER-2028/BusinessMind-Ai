/**
 * Document Mongoose Model.
 *
 * Multi-tenant business document model with strict state machine verification,
 * metadata tracking, checksum indexing, and organization isolation.
 */

import mongoose, { Schema, Document, Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export const DOCUMENT_PROCESSING_STATUS = {
  UPLOADING: 'UPLOADING',
  UPLOADED: 'UPLOADED',
  VALIDATING: 'VALIDATING',
  PROCESSING: 'PROCESSING',
  READY: 'READY',
  FAILED: 'FAILED',
  DELETED: 'DELETED',
} as const;

export type DocumentProcessingStatus =
  (typeof DOCUMENT_PROCESSING_STATUS)[keyof typeof DOCUMENT_PROCESSING_STATUS];

export const ALLOWED_STATUS_TRANSITIONS: Record<
  DocumentProcessingStatus,
  DocumentProcessingStatus[]
> = {
  [DOCUMENT_PROCESSING_STATUS.UPLOADING]: [
    DOCUMENT_PROCESSING_STATUS.UPLOADED,
    DOCUMENT_PROCESSING_STATUS.FAILED,
    DOCUMENT_PROCESSING_STATUS.DELETED,
  ],
  [DOCUMENT_PROCESSING_STATUS.UPLOADED]: [
    DOCUMENT_PROCESSING_STATUS.VALIDATING,
    DOCUMENT_PROCESSING_STATUS.FAILED,
    DOCUMENT_PROCESSING_STATUS.DELETED,
  ],
  [DOCUMENT_PROCESSING_STATUS.VALIDATING]: [
    DOCUMENT_PROCESSING_STATUS.PROCESSING,
    DOCUMENT_PROCESSING_STATUS.FAILED,
    DOCUMENT_PROCESSING_STATUS.DELETED,
  ],
  [DOCUMENT_PROCESSING_STATUS.PROCESSING]: [
    DOCUMENT_PROCESSING_STATUS.READY,
    DOCUMENT_PROCESSING_STATUS.FAILED,
    DOCUMENT_PROCESSING_STATUS.DELETED,
  ],
  [DOCUMENT_PROCESSING_STATUS.READY]: [
    DOCUMENT_PROCESSING_STATUS.PROCESSING, // re-processing
    DOCUMENT_PROCESSING_STATUS.DELETED,
  ],
  [DOCUMENT_PROCESSING_STATUS.FAILED]: [
    DOCUMENT_PROCESSING_STATUS.PROCESSING, // retry processing
    DOCUMENT_PROCESSING_STATUS.DELETED,
  ],
  [DOCUMENT_PROCESSING_STATUS.DELETED]: [
    DOCUMENT_PROCESSING_STATUS.READY, // restore
  ],
};

export function isValidStatusTransition(
  from: DocumentProcessingStatus,
  to: DocumentProcessingStatus,
): boolean {
  if (from === to) return true;
  return ALLOWED_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

export interface IDocumentDocument extends Document<string> {
  _id: string;
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
  processingStatus: DocumentProcessingStatus;
  processingProgress: number;
  processingError?: string | null;
  currentVersion: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

const DocumentSchema = new Schema<IDocumentDocument>(
  {
    _id: {
      type: String,
      default: () => uuidv4(),
    },
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
    uploadedBy: {
      type: String,
      ref: 'User',
      required: true,
    },
    originalFilename: {
      type: String,
      required: true,
    },
    displayName: {
      type: String,
      required: true,
    },
    fileType: {
      type: String,
      required: true,
      enum: ['pdf', 'docx', 'xlsx', 'csv', 'txt', 'md'],
    },
    mimeType: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
      min: 0,
    },
    storageProvider: {
      type: String,
      required: true,
      enum: ['local', 'cloudinary'],
      default: 'local',
    },
    storageKey: {
      type: String,
      required: true,
    },
    checksum: {
      type: String,
      required: true,
      index: true,
    },
    processingStatus: {
      type: String,
      required: true,
      enum: Object.values(DOCUMENT_PROCESSING_STATUS),
      default: DOCUMENT_PROCESSING_STATUS.UPLOADING,
      index: true,
    },
    processingProgress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    processingError: {
      type: String,
      default: null,
    },
    currentVersion: {
      type: Number,
      default: 1,
      min: 1,
    },
    deletedAt: {
      type: Date,
      default: null,
      index: true,
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
        return ret;
      },
    },
  },
);

DocumentSchema.index({ organizationId: 1, deletedAt: 1, createdAt: -1 });
DocumentSchema.index({ organizationId: 1, processingStatus: 1 });
DocumentSchema.index({ organizationId: 1, knowledgeBaseId: 1 });
DocumentSchema.index({ organizationId: 1, checksum: 1 });

export const DocumentModel: Model<IDocumentDocument> =
  mongoose.models['Document'] || mongoose.model<IDocumentDocument>('Document', DocumentSchema);
