import { Badge } from '../../../components/ui/Badge';
import type { BadgeVariant } from '../../../components/ui/Badge';
import type { Decision, DecisionOutcome } from '../../../types/business';

const outcomeVariant: Record<DecisionOutcome, BadgeVariant> = {
  approved: 'success',
  rejected: 'danger',
  pending: 'warning',
};

export function RecentDecisionsList({ decisions }: { decisions: Decision[] }) {
  return (
    <ul className="divide-y divide-border">
      {decisions.map((decision) => (
        <li key={decision.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-text-primary">{decision.title}</p>
            <p className="text-xs text-text-secondary">
              {decision.owner} · {decision.dateLabel}
            </p>
          </div>
          <Badge variant={outcomeVariant[decision.outcome]} className="shrink-0">
            {decision.outcome}
          </Badge>
        </li>
      ))}
    </ul>
  );
}
