import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import type { TableColumn } from '../../components/ui/Table';
import { PageHeader } from '../../components/ui/PageHeader';
import { MetricCard, MiniBarChart } from '../../components/domain';
import { analyticsMetrics, weeklyDecisionVolume, analyticsTableRows } from '../../mocks/analytics.mock';
import type { AnalyticsRow } from '../../mocks/analytics.mock';

const columns: TableColumn<AnalyticsRow>[] = [
  { key: 'metric', header: 'Metric' },
  { key: 'thisPeriod', header: 'This period', align: 'right' },
  { key: 'lastPeriod', header: 'Last period', align: 'right' },
  {
    key: 'change',
    header: 'Change',
    align: 'right',
    render: (row) => (
      <span className={row.change.startsWith('-') ? 'text-danger' : 'text-success'}>{row.change}</span>
    ),
  },
];

export function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Analytics" description="Business metrics and trends over time." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {analyticsMetrics.map((metric) => (
          <MetricCard key={metric.id} metric={metric} />
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Decision Volume (This Week)</CardTitle>
        </CardHeader>
        <CardContent>
          <MiniBarChart data={weeklyDecisionVolume} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Period Comparison</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table columns={columns} data={analyticsTableRows} keyExtractor={(row) => row.id} />
        </CardContent>
      </Card>
    </div>
  );
}
