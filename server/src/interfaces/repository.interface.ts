/**
 * Repository interfaces.
 *
 * Defines the generic CRUD contract that all repository implementations
 * must satisfy. The service layer depends only on these interfaces,
 * not on concrete Mongoose implementations — enabling easy swapping
 * of data sources (MongoDB, PostgreSQL, in-memory for tests).
 *
 * Phase 4: Interface definitions only.
 * Phase 5: Concrete Mongoose implementations.
 */

import type { PaginationOptions, PaginationMeta } from '../types/common.types';

// ─── Generic CRUD Interface ───────────────────────────────────────────────────

/**
 * Base repository interface with standard CRUD operations.
 *
 * @template T  - The domain entity type (plain object, not a Mongoose document).
 * @template C  - The DTO type for create operations.
 * @template U  - The DTO type for update operations (partial by convention).
 */
export interface IRepository<T, C, U> {
  /**
   * Finds a single entity by its ID.
   * @returns The entity, or null if not found.
   */
  findById(id: string): Promise<T | null>;

  /**
   * Finds a paginated list of entities matching optional filters.
   */
  findAll(
    filters: Partial<T>,
    pagination: PaginationOptions,
  ): Promise<{ data: T[]; pagination: PaginationMeta }>;

  /**
   * Creates a new entity and returns the persisted result.
   */
  create(data: C): Promise<T>;

  /**
   * Updates an entity by ID with partial data.
   * @returns The updated entity, or null if not found.
   */
  update(id: string, data: Partial<U>): Promise<T | null>;

  /**
   * Soft-deletes an entity by ID (sets deletedAt).
   * @returns true if deleted, false if not found.
   */
  delete(id: string): Promise<boolean>;

  /**
   * Counts entities matching optional filters.
   */
  count(filters?: Partial<T>): Promise<number>;

  /**
   * Checks whether an entity with the given ID exists.
   */
  exists(id: string): Promise<boolean>;
}

// ─── Read-only Repository ─────────────────────────────────────────────────────

/**
 * Read-only repository variant for query-only data access (e.g. analytics).
 */
export interface IReadonlyRepository<T> {
  findById(id: string): Promise<T | null>;
  findAll(filters: Partial<T>, pagination: PaginationOptions): Promise<{ data: T[]; pagination: PaginationMeta }>;
  count(filters?: Partial<T>): Promise<number>;
  exists(id: string): Promise<boolean>;
}

// ─── Soft-Delete Repository ───────────────────────────────────────────────────

/**
 * Extends the base repository with hard delete and restore for entities
 * that support a full soft-delete lifecycle.
 */
export interface ISoftDeleteRepository<T, C, U> extends IRepository<T, C, U> {
  restore(id: string): Promise<T | null>;
  hardDelete(id: string): Promise<boolean>;
  findTrashed(pagination: PaginationOptions): Promise<{ data: T[]; pagination: PaginationMeta }>;
}
