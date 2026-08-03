import { useMemo, useState } from 'react';
import { RecommendationCard } from '../../components/domain';
import { Select } from '../../components/ui/Input';
import { PageHeader } from '../../components/ui/PageHeader';
import { EmptyState } from '../../components/ui/EmptyState';
import { allRecommendations } from '../../mocks/recommendations.mock';

const riskOptions = [
  { label: 'All risk levels', value: 'all' },
  { label: 'Low risk', value: 'low' },
  { label: 'Medium risk', value: 'medium' },
  { label: 'High risk', value: 'high' },
];

export function RecommendationsPage() {
  const [riskFilter, setRiskFilter] = useState('all');

  const filtered = useMemo(
    () => allRecommendations.filter((rec) => riskFilter === 'all' || rec.riskLevel === riskFilter),
    [riskFilter],
  );

  return (
    <div className="space-y-4">
      <PageHeader
        title="Recommendations"
        description="AI-generated suggestions ranked by confidence and risk."
        actions={
          <div className="w-44">
            <Select
              options={riskOptions}
              value={riskFilter}
              onChange={(event) => setRiskFilter(event.target.value)}
            />
          </div>
        }
      />

      {filtered.length === 0 ? (
        <EmptyState title="No recommendations" description="Nothing matches this filter right now." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((recommendation) => (
            <RecommendationCard key={recommendation.id} recommendation={recommendation} />
          ))}
        </div>
      )}
    </div>
  );
}
