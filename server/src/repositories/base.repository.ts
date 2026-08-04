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
import type { IRepository } from '../interfaces/repository.interface';
import type { PaginationOptions, PaginationMeta } from '../types/common.types';
import { buildPaginationMeta, toMongoosePagination } from '../utils/pagination.util';

export abstract class BaseRepository<TDocument, TEntity, TCreate, TUpdate>
  implements IRepository<TEntity, TCreate, TUpdate>
{
  constructor(protected readonly model: Model<TDocument>) {}

  // ─── Abstract Methods ────────────────────────────────────────────────────────

  /**
   * Transforms a Mongoose document to a plain domain entity.
   * Implemented by each concrete repository.
   */
  protected abstract toEntity(document: TDocument): TEntity;

  // ─── findById ────────────────────────────────────────────────────────────────

  async findById(id: string): Promise<TEntity | null> {
    const doc = await this.model.findById(id).exec();
    return doc ? this.toEntity(doc) : null;
  }

  // ─── findAll ─────────────────────────────────────────────────────────────────

  async findAll(
    filters: FilterQuery<TDocument>,
    pagination: PaginationOptions,
  ): Promise<{ data: TEntity[]; pagination: PaginationMeta }> {
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
    const doc = await this.model.create(data);
    return this.toEntity(doc);
  }

  // ─── update ──────────────────────────────────────────────────────────────────

  async update(id: string, data: Partial<TUpdate>): Promise<TEntity | null> {
    const doc = await this.model
      .findByIdAndUpdate(
        id,
        { $set: data as UpdateQuery<TDocument> },
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
    const result = await this.model
      .findByIdAndUpdate(id, { $set: { deletedAt: new Date() } }, { new: true })
      .exec();
    return result !== null;
  }

  // ─── count ───────────────────────────────────────────────────────────────────

  async count(filters: FilterQuery<TDocument> = {}): Promise<number> {
    return this.model.countDocuments(filters).exec();
  }

  // ─── exists ──────────────────────────────────────────────────────────────────

  async exists(id: string): Promise<boolean> {
    const result = await this.model.exists({ _id: id }).exec();
    return result !== null;
  }

  // ─── findOne ─────────────────────────────────────────────────────────────────

  /**
   * Finds a single entity matching a filter.
   * Not in the IRepository interface — available as a protected utility.
   */
  protected async findOne(filters: FilterQuery<TDocument>): Promise<TEntity | null> {
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
    const doc = await this.model.findOne({ [field]: value } as FilterQuery<TDocument>).exec();
    return doc ? this.toEntity(doc) : null;
  }
}
