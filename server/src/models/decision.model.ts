import mongoose, { Schema, Document as MongooseDocument } from 'mongoose';

export type DecisionStatus = 'pending' | 'in_progress' | 'implemented' | 'archived' | 'approved' | 'rejected';
export type DecisionOutcome = 'approved' | 'rejected' | 'pending';

export interface IDecisionDocument extends MongooseDocument<string> {
  _id: string;
  id: string;
  organizationId: string;
  createdBy: string;
  title: string;
  description: string;
  status: DecisionStatus;
  outcome: DecisionOutcome;
  category: string;
  owner: string;
  source?: string;
  isAiGenerated: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const decisionSchema = new Schema<IDecisionDocument>(
  {
    _id: { type: String, required: true },
    organizationId: { type: String, required: true, index: true },
    createdBy: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 255 },
    description: { type: String, default: '', trim: true, maxlength: 2000 },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'implemented', 'archived', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    outcome: {
      type: String,
      enum: ['approved', 'rejected', 'pending'],
      default: 'pending',
    },
    category: { type: String, default: 'General', trim: true },
    owner: { type: String, required: true, trim: true },
    source: { type: String, default: 'Manual' },
    isAiGenerated: { type: Boolean, default: false },
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

decisionSchema.index({ organizationId: 1, createdAt: -1 });

export const DecisionModel =
  mongoose.models['Decision'] || mongoose.model<IDecisionDocument>('Decision', decisionSchema);
