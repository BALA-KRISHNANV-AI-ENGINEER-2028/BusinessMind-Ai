/**
 * Mongoose global configuration.
 *
 * Applies global Mongoose settings that affect all models.
 * Must be called once, before any model is compiled.
 *
 * Phase 4: Configuration only.
 * Phase 5: Plugin registration (e.g. mongoose-paginate-v2, soft-delete).
 */

import mongoose from 'mongoose';
import { logger } from '../config/logger.config';

/**
 * Applies global Mongoose settings.
 *
 * Called from lib/database.ts before the first connection is established.
 */
export function configureMongoose(): void {
  // ── Strict mode: reject fields not in schema ──────────────────────────────
  mongoose.set('strict', true);

  // ── Strict query mode: reject unknown query filters ───────────────────────
  mongoose.set('strictQuery', true);

  // ── Auto-index: only in development (production manages indexes separately) ─
  mongoose.set('autoIndex', process.env['NODE_ENV'] !== 'production');

  // ── toJSON transform: convert _id → id, strip __v ─────────────────────────
  // Applied globally so all models return clean domain objects.
  mongoose.set('toJSON', {
    virtuals: true,
    transform: (_doc: unknown, ret: Record<string, unknown>) => {
      ret['id'] = ret['_id'];
      delete ret['_id'];
      delete ret['__v'];
      return ret;
    },
  });

  // ── toObject transform (mirrors toJSON) ───────────────────────────────────
  mongoose.set('toObject', {
    virtuals: true,
    transform: (_doc: unknown, ret: Record<string, unknown>) => {
      ret['id'] = ret['_id'];
      delete ret['_id'];
      delete ret['__v'];
      return ret;
    },
  });

  logger.debug('Mongoose global configuration applied');
}

/**
 * Returns a boolean indicating whether Mongoose is configured.
 * Useful for health checks and diagnostics.
 */
export function isMongooseConfigured(): boolean {
  return mongoose.get('strict') === true;
}
