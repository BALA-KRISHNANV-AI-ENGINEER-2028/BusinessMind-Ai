import type { ReactNode } from 'react';
import { ListChecks } from 'lucide-react';
import { ConfidenceScoreBadge, RecommendationCard } from '../../../components/domain';
import { EvidenceCard } from './EvidenceCard';
import { RiskCard } from './RiskCard';
import type { StructuredResponse as StructuredResponseData } from '../../../types/chat';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">{title}</p>
      {children}
    </div>
  );
}

export function StructuredResponse({ response }: { response: StructuredResponseData }) {
  return (
    <div className="w-full space-y-4 rounded-lg border border-border bg-bg-base p-4">
      <div className="flex items-start justify-between gap-3">
        <Section title="Summary">
          <p className="text-sm text-text-primary">{response.summary}</p>
        </Section>
        <ConfidenceScoreBadge score={response.confidence} />
      </div>

      <Section title="Evidence">
        <div className="space-y-2">
          {response.evidence.map((item) => (
            <EvidenceCard key={item.id} evidence={item} />
          ))}
        </div>
      </Section>

      <Section title="Business Risks">
        <div className="space-y-2">
          {response.risks.map((risk) => (
            <RiskCard key={risk.id} risk={risk} />
          ))}
        </div>
      </Section>

      <Section title="Recommendations">
        <div className="space-y-2">
          {response.recommendations.map((recommendation) => (
            <RecommendationCard key={recommendation.id} recommendation={recommendation} />
          ))}
        </div>
      </Section>

      <Section title="Action Plan">
        <ul className="space-y-1.5">
          {response.actionPlan.map((step, index) => (
            <li key={index} className="flex items-start gap-2 text-sm text-text-primary">
              <ListChecks size={16} className="mt-0.5 shrink-0 text-accent" aria-hidden="true" />
              {step}
            </li>
          ))}
        </ul>
      </Section>
    </div>
  );
}
