import { ShieldAlert } from 'lucide-react';
import { Badge } from '../../../components/ui/Badge';
import type { BadgeVariant } from '../../../components/ui/Badge';
import type { RiskItem } from '../../../types/chat';

const levelVariant: Record<RiskItem['level'], BadgeVariant> = {
  low: 'success',
  medium: 'warning',
  high: 'danger',
};

export function RiskCard({ risk }: { risk: RiskItem }) {
  return (
    <div className="flex gap-2.5 rounded-md border border-border bg-bg-base p-3">
      <ShieldAlert size={16} className="mt-0.5 shrink-0 text-text-secondary" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium text-text-primary">{risk.title}</p>
          <Badge variant={levelVariant[risk.level]}>{risk.level} risk</Badge>
        </div>
        <p className="mt-1 text-sm text-text-secondary">{risk.description}</p>
      </div>
    </div>
  );
}
