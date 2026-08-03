import { Card, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { ConfidenceScoreBadge } from './ConfidenceScoreBadge';
import type { Recommendation } from '../../types/business';

const riskVariant = {
  low: 'success',
  medium: 'warning',
  high: 'danger',
} as const;

export function RecommendationCard({ recommendation }: { recommendation: Recommendation }) {
  return (
    <Card>
      <CardContent className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-semibold text-text-primary">{recommendation.title}</p>
          <Badge variant="neutral" className="shrink-0">
            {recommendation.category}
          </Badge>
        </div>
        <p className="text-sm text-text-secondary">{recommendation.summary}</p>
        <div className="flex flex-wrap items-center gap-2">
          <ConfidenceScoreBadge score={recommendation.confidence} />
          <Badge variant={riskVariant[recommendation.riskLevel]}>{recommendation.riskLevel} risk</Badge>
        </div>
      </CardContent>
    </Card>
  );
}
