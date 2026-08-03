import type { Recommendation } from '../types/business';

export const allRecommendations: Recommendation[] = [
  {
    id: '1',
    title: 'Renegotiate cloud infrastructure contract',
    summary: 'Current usage patterns suggest a 15% cost reduction is achievable with a multi-year commitment.',
    confidence: 82,
    riskLevel: 'low',
    category: 'Cost optimization',
  },
  {
    id: '2',
    title: 'Delay APAC expansion by one quarter',
    summary: 'Regulatory approval timelines in target markets are running longer than initially projected.',
    confidence: 68,
    riskLevel: 'medium',
    category: 'Market strategy',
  },
  {
    id: '3',
    title: 'Consolidate marketing analytics tools',
    summary: 'Three overlapping subscriptions were identified; consolidating to one could cut spend by 22%.',
    confidence: 74,
    riskLevel: 'low',
    category: 'Cost optimization',
  },
  {
    id: '4',
    title: 'Diversify supplier base for key component',
    summary: 'Single-supplier dependency for a critical component creates exposure to shipping delays.',
    confidence: 59,
    riskLevel: 'high',
    category: 'Operational risk',
  },
  {
    id: '5',
    title: 'Accelerate hiring for support team',
    summary: 'Ticket volume growth is outpacing current support headcount, risking response-time SLAs.',
    confidence: 71,
    riskLevel: 'medium',
    category: 'Workforce planning',
  },
];
