/**
 * Document Version Mongoose Model.
 *
 * Stores historic version records for documents to enable traceablity and versioning.
 */

import mongoose, { Schema, Document, Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export interface IDocumentVersionDocument extends Document<string> {
  _id: string;
  documentId: string;
  organizationId: string;
  version: number;
  fileSize: number;
  mimeType: string;
  storageKey: string;
  checksum: string;
  extractedTextLength: number;
  createdAt: Date;
}

const DocumentVersionSchema = new Schema<IDocumentVersionDocument>(
  {
    _id: {
      type: String,
      default: () => uuidv4(),
    },
    documentId: {
      type: String,
      ref: 'Document',
      required: true,
      index: true,
    },
    organizationId: {
      type: String,
      ref: 'Organization',
      required: true,
      index: true,
    },
    version: {
      type: Number,
      required: true,
      min: 1,
    },
    fileSize: {
      type: Number,
      required: true,
      min: 0,
    },
    mimeType: {
      type: String,
      required: true,
    },
    storageKey: {
      type: String,
      required: true,
    },
    checksum: {
      type: String,
      required: true,
    },
    extractedTextLength: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
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

DocumentVersionSchema.index({ documentId: 1, version: 1 }, { unique: true });


export const DocumentVersionModel: Model<IDocumentVersionDocument> =
  mongoose.models['DocumentVersion'] ||
  mongoose.model<IDocumentVersionDocument>('DocumentVersion', DocumentVersionSchema);
