import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardContent } from '../ui/Card';
import { cn } from '../../lib/utils';
import type { Metric } from '../../types/business';

const trendIcon = {
  up: TrendingUp,
  down: TrendingDown,
  flat: Minus,
};

const toneClasses = {
  positive: 'text-success',
  negative: 'text-danger',
  neutral: 'text-text-secondary',
};

export function MetricCard({ metric }: { metric: Metric }) {
  const Icon = metric.trend ? trendIcon[metric.trend] : null;
  const tone = metric.tone ?? 'neutral';

  return (
    <Card>
      <CardContent className="space-y-2">
        <p className="text-sm text-text-secondary">{metric.label}</p>
        <p className="text-2xl font-semibold text-text-primary">{metric.value}</p>
        {metric.delta && (
          <p className={cn('flex items-center gap-1 text-xs font-medium', toneClasses[tone])}>
            {Icon && <Icon size={14} aria-hidden="true" />}
            {metric.delta}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
