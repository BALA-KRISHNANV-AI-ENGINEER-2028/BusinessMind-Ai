/**
 * Recommendations Module — Types.
 * Mirrors frontend Recommendation type.
 */

import type { ISODateString } from '../../types/common.types';
import type { RiskLevel } from '../../types/common.types';

export type RiskLevelType = 'low' | 'medium' | 'high';
export type RecommendationStatus = 'active' | 'dismissed' | 'implemented';

export interface Recommendation {
  id: string;
  organizationId: string;
  title: string;
  summary: string;
  confidence: number; // 0-100
  riskLevel: RiskLevelType;
  category: string;
  status: RecommendationStatus;
  sourceDocumentIds: string[];
  // Phase 6+: generatedByAgent, evidenceItems, actionPlan
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface DismissRecommendationDto {
  reason?: string;
}
