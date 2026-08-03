import { Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { cn } from '../../../lib/utils';
import type { AgentState, AgentStatusInfo } from '../../../types/business';

const stateConfig: Record<AgentState, { icon: typeof Loader2; className: string; label: string }> = {
  running: { icon: Loader2, className: 'text-accent-text', label: 'Running' },
  idle: { icon: CheckCircle2, className: 'text-success', label: 'Idle' },
  error: { icon: AlertTriangle, className: 'text-danger', label: 'Error' },
};

export function AgentStatusCard({ agent }: { agent: AgentStatusInfo }) {
  const { icon: Icon, className, label } = stateConfig[agent.state];

  return (
    <div className="flex items-start gap-3 rounded-md border border-border p-3">
      <Icon size={18} className={cn('mt-0.5 shrink-0', className, agent.state === 'running' && 'animate-spin')} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-medium text-text-primary">{agent.name}</p>
          <span className={cn('text-xs font-medium', className)}>{label}</span>
        </div>
        <p className="mt-0.5 text-xs text-text-secondary">{agent.description}</p>
        <p className="mt-1 text-xs text-text-disabled">{agent.lastRunLabel}</p>
      </div>
    </div>
  );
}
