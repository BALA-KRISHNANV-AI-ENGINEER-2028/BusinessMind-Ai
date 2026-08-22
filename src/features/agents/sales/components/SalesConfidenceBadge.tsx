/**
 * SalesConfidenceBadge — Phase 9: Sales Intelligence Agent UI.
 *
 * Visual indicator for agent confidence levels.
 */

import React from 'react';
import { ShieldCheck, ShieldAlert, AlertCircle } from 'lucide-react';
import type { AiConfidenceLevel } from '../../../../types/ai-query';

interface SalesConfidenceBadgeProps {
  level: AiConfidenceLevel;
}

const CONFIDENCE_CONFIG: Record<
  AiConfidenceLevel,
  { label: string; bg: string; text: string; border: string; Icon: typeof ShieldCheck }
> = {
  high: {
    label: 'High Confidence',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
    Icon: ShieldCheck,
  },
  medium: {
    label: 'Medium Confidence',
    bg: 'bg-indigo-500/10',
    text: 'text-indigo-400',
    border: 'border-indigo-500/30',
    Icon: ShieldCheck,
  },
  low: {
    label: 'Low Confidence',
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
    Icon: ShieldAlert,
  },
  insufficient: {
    label: 'Insufficient Evidence',
    bg: 'bg-rose-500/10',
    text: 'text-rose-400',
    border: 'border-rose-500/30',
    Icon: AlertCircle,
  },
};

export const SalesConfidenceBadge: React.FC<SalesConfidenceBadgeProps> = ({ level }) => {
  const config = CONFIDENCE_CONFIG[level] || CONFIDENCE_CONFIG.low;
  const Icon = config.Icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.bg} ${config.text} ${config.border}`}
    >
      <Icon size={13} className="shrink-0" />
      {config.label}
    </span>
  );
};
