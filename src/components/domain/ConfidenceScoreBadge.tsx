import { Badge } from '../ui/Badge';
import type { BadgeVariant } from '../ui/Badge';

function toneForScore(score: number): BadgeVariant {
  if (score >= 75) return 'success';
  if (score >= 50) return 'warning';
  return 'danger';
}

export function ConfidenceScoreBadge({ score }: { score: number }) {
  return <Badge variant={toneForScore(score)}>{score}% confidence</Badge>;
}
