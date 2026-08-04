/** Recommendations Module — Interface. */
import type { Recommendation } from './recommendations.types';
import type { PaginationOptions, PaginationMeta } from '../../types/common.types';

export interface IRecommendationsService {
  getAll(orgId: string, pagination: PaginationOptions): Promise<{ data: Recommendation[]; pagination: PaginationMeta }>;
  getById(id: string, orgId: string): Promise<Recommendation>;
  dismiss(id: string, orgId: string, reason?: string): Promise<Recommendation>;
}
