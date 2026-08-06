/**
 * Permission Mongoose Model.
 *
 * System permission definitions catalog.
 */

import mongoose, { Schema, Document, Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import type { Permission } from '../constants/app.constants';

export interface IPermissionDocument extends Document<string> {
  _id: string;
  key: Permission;
  name: string;
  category: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

const PermissionSchema = new Schema<IPermissionDocument>(
  {
    _id: {
      type: String,
      default: () => uuidv4(),
    },
    key: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
      index: true,
    },
    description: {
      type: String,
      default: '',
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

export const PermissionModel: Model<IPermissionDocument> =
  mongoose.models['Permission'] ||
  mongoose.model<IPermissionDocument>('Permission', PermissionSchema);
