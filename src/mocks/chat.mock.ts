import type { ChatMessage, ChatThread } from '../types/chat';

export const promptSuggestions = [
  'Analyze Q3 cloud infrastructure spend and suggest savings',
  'What are the key risks of expanding into the APAC region?',
  'Summarize recent vendor contract renewals and expiration dates',
  'Compare our current support staffing against SLA targets',
];

export const chatThreads: ChatThread[] = [
  { id: '1', title: 'Cloud infrastructure costs', previewLabel: 'Renegotiate the contract...', timestampLabel: '10:32 AM', isActive: true },
  { id: '2', title: 'APAC expansion risk review', previewLabel: 'Regulatory timelines suggest...', timestampLabel: 'Yesterday' },
  { id: '3', title: 'Marketing spend Q3', previewLabel: 'A 10% reduction could...', timestampLabel: '2 days ago' },
];

export const activeThreadMessages: ChatMessage[] = [
  {
    id: '1',
    role: 'user',
    content: 'Should we renegotiate our cloud infrastructure contract this quarter?',
    timestampLabel: '10:30 AM',
  },
  {
    id: '2',
    role: 'assistant',
    content:
      "Based on your last 6 months of usage and current market rates, renegotiating now looks favorable. Here's my analysis.",
    timestampLabel: '10:32 AM',
    structured: {
      summary:
        'Current usage patterns and a competitive vendor market suggest a 15% cost reduction is achievable with a multi-year commitment.',
      evidence: [
        {
          id: '1',
          source: 'Vendor invoice history (last 6 months)',
          snippet: 'Compute spend has grown 22% while unit pricing has stayed flat despite volume discounts typically applying at this tier.',
        },
        {
          id: '2',
          source: 'Market rate comparison',
          snippet: 'Two competing providers quoted 12-18% lower list pricing for equivalent committed-use tiers this quarter.',
        },
      ],
      confidence: 82,
      risks: [
        {
          id: '1',
          title: 'Vendor lock-in',
          level: 'medium',
          description: 'A multi-year commitment reduces flexibility to switch providers if service quality declines.',
        },
        {
          id: '2',
          title: 'Migration disruption',
          level: 'low',
          description: 'Switching providers entirely would carry higher short-term risk than renegotiating in place.',
        },
      ],
      recommendations: [
        {
          id: '1',
          title: 'Renegotiate cloud infrastructure contract',
          summary: 'Approach the current vendor with competing quotes to secure a 15% reduction on a 2-year term.',
          confidence: 82,
          riskLevel: 'low',
          category: 'Cost optimization',
        },
      ],
      actionPlan: [
        'Request updated quotes from the two competing vendors this week',
        'Share quotes with current vendor account manager to open renegotiation',
        'Target signed amendment before next billing cycle (18 days)',
      ],
    },
  },
];
