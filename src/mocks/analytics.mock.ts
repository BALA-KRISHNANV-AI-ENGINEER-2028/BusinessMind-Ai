import type { Metric } from '../types/business';

export const analyticsMetrics: Metric[] = [
  { id: 'revenue', label: 'Revenue (MTD)', value: '$482K', delta: '+8.2%', trend: 'up', tone: 'positive' },
  { id: 'churn', label: 'Churn Rate', value: '2.1%', delta: '-0.4%', trend: 'down', tone: 'positive' },
  { id: 'decisions', label: 'Decisions Made', value: '34', delta: '+6', trend: 'up', tone: 'positive' },
  { id: 'avg-confidence', label: 'Avg. Recommendation Confidence', value: '76%', delta: '+3%', trend: 'up', tone: 'positive' },
];

export interface DecisionVolume {
  label: string;
  value: number;
}

export const weeklyDecisionVolume: DecisionVolume[] = [
  { label: 'Mon', value: 4 },
  { label: 'Tue', value: 7 },
  { label: 'Wed', value: 5 },
  { label: 'Thu', value: 9 },
  { label: 'Fri', value: 6 },
  { label: 'Sat', value: 2 },
  { label: 'Sun', value: 1 },
];

export interface AnalyticsRow {
  id: string;
  metric: string;
  thisPeriod: string;
  lastPeriod: string;
  change: string;
}

export const analyticsTableRows: AnalyticsRow[] = [
  { id: '1', metric: 'Revenue', thisPeriod: '$482K', lastPeriod: '$445K', change: '+8.2%' },
  { id: '2', metric: 'Operating costs', thisPeriod: '$298K', lastPeriod: '$310K', change: '-3.9%' },
  { id: '3', metric: 'New recommendations', thisPeriod: '12', lastPeriod: '9', change: '+33%' },
  { id: '4', metric: 'Documents processed', thisPeriod: '184', lastPeriod: '163', change: '+13%' },
];
