/**
 * Abstract Base Repository.
 *
 * Provides default Mongoose implementations for the IRepository interface.
 * All concrete repositories (UserRepository, OrganizationRepository, etc.)
 * extend this class so common CRUD logic is written only once.
 *
 * Phase 4: Abstract scaffold — no concrete models yet (Phase 5).
 * Phase 5: Add concrete subclasses per module.
 *
 * @template TDocument - The Mongoose Document type.
 * @template TEntity   - The plain domain entity type returned to the service layer.
 * @template TCreate   - DTO type for create operations.
 * @template TUpdate   - DTO type for update operations.
 */

import type { Model, FilterQuery, UpdateQuery } from 'mongoose';
import crypto from 'crypto';
import type { IRepository } from '../interfaces/repository.interface';
import type { PaginationOptions, PaginationMeta } from '../types/common.types';
import { buildPaginationMeta, toMongoosePagination } from '../utils/pagination.util';
import { isDatabaseConnected } from '../config/database.config';

export abstract class BaseRepository<TDocument, TEntity, TCreate, TUpdate>
  implements IRepository<TEntity, TCreate, TUpdate>
{
  protected readonly memoryStore: Map<string, any> = new Map();

  constructor(protected readonly model: Model<TDocument>) {}

  // ─── Abstract Methods ────────────────────────────────────────────────────────

  /**
   * Transforms a Mongoose document to a plain domain entity.
   * Implemented by each concrete repository.
   */
  protected abstract toEntity(document: TDocument): TEntity;

  protected isConnected(): boolean {
    return isDatabaseConnected();
  }

  // ─── findById ────────────────────────────────────────────────────────────────

  async findById(id: string): Promise<TEntity | null> {
    if (!this.isConnected()) {
      const item = this.memoryStore.get(id);
      if (!item || item.deletedAt) return null;
      return item as TEntity;
    }
    const doc = await this.model.findById(id).exec();
    return doc ? this.toEntity(doc) : null;
  }

  // ─── findAll ─────────────────────────────────────────────────────────────────

  async findAll(
    filters: FilterQuery<TDocument>,
    pagination: PaginationOptions,
  ): Promise<{ data: TEntity[]; pagination: PaginationMeta }> {
    if (!this.isConnected()) {
      let items = Array.from(this.memoryStore.values()).filter((it) => !it.deletedAt);
      for (const [key, val] of Object.entries(filters)) {
        if (val !== undefined && val !== null) {
          items = items.filter((it) => it[key] === val);
        }
      }
      const total = items.length;
      const { skip, limit } = toMongoosePagination(pagination);
      const data = items.slice(skip, skip + limit) as TEntity[];
      return {
        data,
        pagination: buildPaginationMeta(pagination, total),
      };
    }

    const { skip, limit } = toMongoosePagination(pagination);

    const sortField = pagination.sortBy ?? 'createdAt';
    const sortOrder = pagination.sortDirection === 'asc' ? 1 : -1;

    const [docs, total] = await Promise.all([
      this.model
        .find(filters)
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.model.countDocuments(filters).exec(),
    ]);

    return {
      data: docs.map((doc) => this.toEntity(doc)),
      pagination: buildPaginationMeta(pagination, total),
    };
  }

  // ─── create ──────────────────────────────────────────────────────────────────

  async create(data: TCreate): Promise<TEntity> {
    if (!this.isConnected()) {
      const id =
        (data as any).id || (data as any)._id || crypto.randomUUID();
      const now = new Date().toISOString();
      const entity = {
        ...(data as any),
        id,
        _id: id,
        createdAt: (data as any).createdAt || now,
        updatedAt: now,
      } as TEntity;
      this.memoryStore.set(id, entity);
      return entity;
    }
    const doc = await this.model.create(data);
    return this.toEntity(doc);
  }

  // ─── update ──────────────────────────────────────────────────────────────────

  async update(id: string, data: Partial<TUpdate>): Promise<TEntity | null> {
    if (!this.isConnected()) {
      const existing = this.memoryStore.get(id);
      if (!existing || existing.deletedAt) return null;
      const updated = {
        ...existing,
        ...(data as any),
        updatedAt: new Date().toISOString(),
      };
      this.memoryStore.set(id, updated);
      return updated as TEntity;
    }
    const doc = await this.model
      .findByIdAndUpdate(
        id,
        { $set: data as unknown as UpdateQuery<TDocument> },
        { new: true, runValidators: true },
      )
      .exec();
    return doc ? this.toEntity(doc) : null;
  }

  // ─── delete ──────────────────────────────────────────────────────────────────

  /**
   * Soft delete — sets `deletedAt` field.
   * The Mongoose model must include a `deletedAt` field for this to work.
   * Falls back to hard delete if no soft-delete field is present.
   */
  async delete(id: string): Promise<boolean> {
    if (!this.isConnected()) {
      const existing = this.memoryStore.get(id);
      if (!existing) return false;
      existing.deletedAt = new Date().toISOString();
      return true;
    }
    const result = await this.model
      .findByIdAndUpdate(id, { $set: { deletedAt: new Date() } }, { new: true })
      .exec();
    return result !== null;
  }

  // ─── count ───────────────────────────────────────────────────────────────────

  async count(filters: FilterQuery<TDocument> = {}): Promise<number> {
    if (!this.isConnected()) {
      let items = Array.from(this.memoryStore.values()).filter((it) => !it.deletedAt);
      for (const [key, val] of Object.entries(filters)) {
        if (val !== undefined && val !== null) {
          items = items.filter((it) => it[key] === val);
        }
      }
      return items.length;
    }
    return this.model.countDocuments(filters).exec();
  }

  // ─── exists ──────────────────────────────────────────────────────────────────

  async exists(id: string): Promise<boolean> {
    if (!this.isConnected()) {
      const item = this.memoryStore.get(id);
      return Boolean(item && !item.deletedAt);
    }
    const result = await this.model.exists({ _id: id }).exec();
    return result !== null;
  }

  // ─── findOne ─────────────────────────────────────────────────────────────────

  /**
   * Finds a single entity matching a filter.
   * Not in the IRepository interface — available as a protected utility.
   */
  protected async findOne(filters: FilterQuery<TDocument>): Promise<TEntity | null> {
    if (!this.isConnected()) {
      let items = Array.from(this.memoryStore.values()).filter((it) => !it.deletedAt);
      for (const [key, val] of Object.entries(filters)) {
        if (val !== undefined && val !== null) {
          items = items.filter((it) => it[key] === val);
        }
      }
      return (items[0] as TEntity) ?? null;
    }
    const doc = await this.model.findOne(filters).exec();
    return doc ? this.toEntity(doc) : null;
  }

  // ─── findByField ─────────────────────────────────────────────────────────────

  /**
   * Convenience method: find one entity where `field === value`.
   */
  protected async findByField(
    field: string,
    value: unknown,
  ): Promise<TEntity | null> {
    if (!this.isConnected()) {
      const items = Array.from(this.memoryStore.values()).filter((it) => !it.deletedAt);
      const found = items.find((it) => it[field] === value);
      return (found as TEntity) ?? null;
    }
    const doc = await this.model.findOne({ [field]: value } as FilterQuery<TDocument>).exec();
    return doc ? this.toEntity(doc) : null;
  }
}
