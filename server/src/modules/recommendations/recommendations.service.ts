/** Recommendations Service — Placeholder. Phase 5: Implementation. */
import { AppError } from '../../errors/AppError';
import { HttpStatus } from '../../constants/http.constants';
import type { IRecommendationsService } from './recommendations.interface';
import type { Recommendation } from './recommendations.types';
import type { PaginationOptions, PaginationMeta } from '../../types/common.types';

const stub = (m: string) => new AppError(`RecommendationsService.${m} not implemented (Phase 5).`, HttpStatus.NOT_IMPLEMENTED, 'NOT_IMPLEMENTED', true);

export class RecommendationsService implements IRecommendationsService {
  async getAll(_orgId: string, _p: PaginationOptions): Promise<{ data: Recommendation[]; pagination: PaginationMeta }> { throw stub('getAll'); }
  async getById(_id: string, _orgId: string): Promise<Recommendation> { throw stub('getById'); }
  async dismiss(_id: string, _orgId: string, _reason?: string): Promise<Recommendation> { throw stub('dismiss'); }
}
export const recommendationsService = new RecommendationsService();
