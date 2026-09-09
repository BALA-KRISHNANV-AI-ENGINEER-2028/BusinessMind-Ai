import mongoose, { Schema, Document as MongooseDocument } from 'mongoose';

export type RiskLevel = 'low' | 'medium' | 'high';
export type RecommendationStatus = 'active' | 'dismissed' | 'implemented';

export interface IEvidenceItem {
  id: string;
  source: string;
  snippet: string;
}

export interface IRecommendationDocument extends MongooseDocument<string> {
  _id: string;
  id: string;
  organizationId: string;
  title: string;
  summary: string;
  description: string;
  confidence: number; // 0-100
  riskLevel: RiskLevel;
  category: string;
  status: RecommendationStatus;
  evidence: IEvidenceItem[];
  sourceDocumentIds: string[];
  createdBy?: string;
  modelMetadata?: {
    provider?: string;
    model?: string;
    promptVersion?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const recommendationSchema = new Schema<IRecommendationDocument>(
  {
    _id: { type: String, required: true },
    organizationId: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 255 },
    summary: { type: String, required: true, trim: true, maxlength: 1000 },
    description: { type: String, default: '', trim: true, maxlength: 4000 },
    confidence: { type: Number, required: true, min: 0, max: 100 },
    riskLevel: { type: String, enum: ['low', 'medium', 'high'], default: 'low', index: true },
    category: { type: String, default: 'Strategic', trim: true },
    status: {
      type: String,
      enum: ['active', 'dismissed', 'implemented'],
      default: 'active',
      index: true,
    },
    evidence: [
      {
        id: { type: String },
        source: { type: String },
        snippet: { type: String },
      },
    ],
    sourceDocumentIds: [{ type: String }],
    createdBy: { type: String },
    modelMetadata: {
      provider: { type: String },
      model: { type: String },
      promptVersion: { type: String },
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

recommendationSchema.index({ organizationId: 1, status: 1, createdAt: -1 });

export const RecommendationModel =
  mongoose.models['Recommendation'] ||
  mongoose.model<IRecommendationDocument>('Recommendation', recommendationSchema);
