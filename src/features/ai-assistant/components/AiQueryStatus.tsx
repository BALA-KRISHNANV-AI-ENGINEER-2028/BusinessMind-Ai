/**
 * AiQueryStatus — Phase 8: LLM Integration.
 *
 * Animated status bar shown while the AI is processing.
 * Transitions through phases: Retrieving → Analyzing → Complete
 */

import { useEffect, useState } from 'react';
import { Database, Brain, CheckCircle2 } from 'lucide-react';

type QueryPhase = 'retrieving' | 'analyzing' | 'complete';

interface AiQueryStatusProps {
  phase: QueryPhase;
}

const PHASE_CONFIG = {
  retrieving: {
    icon: Database,
    label: 'Retrieving business evidence...',
    color: 'text-sky-400',
    bg: 'bg-sky-500/10 border-sky-500/20',
  },
  analyzing: {
    icon: Brain,
    label: 'Analyzing evidence with AI...',
    color: 'text-violet-400',
    bg: 'bg-violet-500/10 border-violet-500/20',
  },
  complete: {
    icon: CheckCircle2,
    label: 'Analysis complete',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/20',
  },
};

export function AiQueryStatus({ phase }: AiQueryStatusProps) {
  const [visible, setVisible] = useState(true);
  const config = PHASE_CONFIG[phase];
  const Icon = config.icon;

  useEffect(() => {
    if (phase === 'complete') {
      const t = setTimeout(() => setVisible(false), 1500);
      return () => clearTimeout(t);
    }
    setVisible(true);
    return undefined;
  }, [phase]);

  if (!visible) return null;

  return (
    <div
      className={`flex items-center gap-2.5 rounded-lg border px-3.5 py-2.5 text-sm font-medium transition-all duration-300 ${config.bg} ${config.color}`}
      aria-live="polite"
      role="status"
    >
      <Icon
        size={15}
        aria-hidden="true"
        className={phase !== 'complete' ? 'animate-pulse' : ''}
      />
      <span>{config.label}</span>
      {phase !== 'complete' && (
        <span className="ml-auto flex gap-0.5" aria-hidden="true">
          <span className="size-1.5 animate-bounce rounded-full bg-current [animation-delay:0ms]" />
          <span className="size-1.5 animate-bounce rounded-full bg-current [animation-delay:150ms]" />
          <span className="size-1.5 animate-bounce rounded-full bg-current [animation-delay:300ms]" />
        </span>
      )}
    </div>
  );
}
