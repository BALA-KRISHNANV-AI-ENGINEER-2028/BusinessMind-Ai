import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { PageHeader } from '../../components/ui/PageHeader';
import { CardSkeleton } from '../../components/ui/Skeleton';
import { MetricCard, RecommendationCard } from '../../components/domain';
import { AgentStatusCard } from './components/AgentStatusCard';
import { RecentDecisionsList } from './components/RecentDecisionsList';
import { RecentDocumentsList } from './components/RecentDocumentsList';
import { QuickActions } from './components/QuickActions';
import { dashboardService } from '../../services/dashboard.service';
import { QUERY_KEYS } from '../../constants';

export function DashboardPage() {
  const { data: metricsRes, isLoading: metricsLoading } = useQuery({
    queryKey: QUERY_KEYS.DASHBOARD_METRICS,
    queryFn: () => dashboardService.getMetrics(),
  });

  const { data: agentsRes } = useQuery({
    queryKey: QUERY_KEYS.DASHBOARD_AGENT_STATUSES,
    queryFn: () => dashboardService.getAgentStatuses(),
  });

  const { data: decisionsRes } = useQuery({
    queryKey: QUERY_KEYS.DASHBOARD_RECENT_DECISIONS,
    queryFn: () => dashboardService.getRecentDecisions(),
  });

  const { data: recommendationsRes } = useQuery({
    queryKey: QUERY_KEYS.DASHBOARD_RECOMMENDATIONS,
    queryFn: () => dashboardService.getDashboardRecommendations(),
  });

  const { data: documentsRes } = useQuery({
    queryKey: QUERY_KEYS.DASHBOARD_RECENT_DOCUMENTS,
    queryFn: () => dashboardService.getRecentDocuments(),
  });

  const metrics = metricsRes?.success ? metricsRes.data : [];
  const agents = agentsRes?.success ? agentsRes.data : [];
  const decisions = decisionsRes?.success ? decisionsRes.data : [];
  const recommendations = recommendationsRes?.success ? recommendationsRes.data : [];
  const documents = documentsRes?.success ? documentsRes.data : [];

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Here's how the business is doing today." />

      {/* Row 1 — Business Health metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metricsLoading
          ? Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
          : metrics.map((metric) => <MetricCard key={metric.id} metric={metric} />)}
      </div>

      {/* Row 2 — Recent Decisions / Agent Status */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <Card className="lg:col-span-8">
          <CardHeader>
            <CardTitle>Recent Decisions</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentDecisionsList decisions={decisions} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Agent Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {agents.map((agent) => (
              <AgentStatusCard key={agent.id} agent={agent} />
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Row 3 — AI Recommendations / Quick Actions + Recent Documents */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-8">
          <h2 className="text-sm font-semibold text-text-primary">AI Recommendations</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {recommendations.map((recommendation) => (
              <RecommendationCard key={recommendation.id} recommendation={recommendation} />
            ))}
          </div>
        </div>

        <div className="space-y-4 lg:col-span-4">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <QuickActions />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <RecentDocumentsList documents={documents} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
