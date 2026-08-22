import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppShell } from '../layouts/AppShell';
import { AuthLayout } from '../layouts/AuthLayout';
import { ErrorLayout } from '../layouts/ErrorLayout';
import { SettingsLayout } from '../layouts/SettingsLayout';
import { ProtectedRoute } from '../routes/ProtectedRoute';
import { PublicRoute } from '../routes/PublicRoute';
import { Skeleton } from '../components/ui/Skeleton';

// Lazy-loaded feature pages
const DashboardPage = lazy(() =>
  import('../features/dashboard/DashboardPage').then((m) => ({ default: m.DashboardPage })),
);
const AIAssistantPage = lazy(() =>
  import('../features/ai-assistant/AIAssistantPage').then((m) => ({ default: m.AIAssistantPage })),
);
const KnowledgeBasePage = lazy(() =>
  import('../features/knowledge-base/KnowledgeBasePage').then((m) => ({ default: m.KnowledgeBasePage })),
);
const DocumentsPage = lazy(() =>
  import('../features/documents/DocumentsPage').then((m) => ({ default: m.DocumentsPage })),
);
const RecommendationsPage = lazy(() =>
  import('../features/recommendations/RecommendationsPage').then((m) => ({ default: m.RecommendationsPage })),
);
const AnalyticsPage = lazy(() =>
  import('../features/analytics/AnalyticsPage').then((m) => ({ default: m.AnalyticsPage })),
);
const OrganizationsPage = lazy(() =>
  import('../features/organizations/OrganizationsPage').then((m) => ({ default: m.OrganizationsPage })),
);
const OrganizationSettingsPage = lazy(() =>
  import('../features/organization/OrganizationSettingsPage').then((m) => ({ default: m.OrganizationSettingsPage })),
);
const SettingsPage = lazy(() =>
  import('../features/settings/SettingsPage').then((m) => ({ default: m.SettingsPage })),
);
const ProfilePage = lazy(() =>
  import('../features/profile/ProfilePage').then((m) => ({ default: m.ProfilePage })),
);
const RetrievalPage = lazy(() =>
  import('../features/retrieval/RetrievalPage').then((m) => ({ default: m.RetrievalPage })),
);
const SalesAgentPage = lazy(() =>
  import('../features/agents/sales/SalesAgentPage').then((m) => ({ default: m.SalesAgentPage })),
);


// Auth & Error Pages
const LoginPage = lazy(() =>
  import('../pages/auth/LoginPage').then((m) => ({ default: m.LoginPage })),
);
const SignUpPage = lazy(() =>
  import('../pages/auth/SignUpPage').then((m) => ({ default: m.SignUpPage })),
);
const OnboardingPage = lazy(() =>
  import('../pages/auth/OnboardingPage').then((m) => ({ default: m.OnboardingPage })),
);
const SessionExpiredPage = lazy(() =>
  import('../pages/auth/SessionExpiredPage').then((m) => ({ default: m.SessionExpiredPage })),
);
const OAuthCallbackPage = lazy(() =>
  import('../pages/auth/OAuthCallbackPage').then((m) => ({ default: m.OAuthCallbackPage })),
);
const NotFoundPage = lazy(() =>
  import('../pages/errors/NotFoundPage').then((m) => ({ default: m.NotFoundPage })),
);
const UnauthorizedPage = lazy(() =>
  import('../pages/errors/UnauthorizedPage').then((m) => ({ default: m.UnauthorizedPage })),
);

function PageFallback() {
  return (
    <div className="space-y-4 p-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-72" />
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-lg" />
        ))}
      </div>
    </div>
  );
}

export const router = createBrowserRouter([
  // Public Routes (Auth)
  {
    element: <PublicRoute />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          {
            path: '/login',
            element: (
              <Suspense fallback={<PageFallback />}>
                <LoginPage />
              </Suspense>
            ),
          },
          {
            path: '/signup',
            element: (
              <Suspense fallback={<PageFallback />}>
                <SignUpPage />
              </Suspense>
            ),
          },
          {
            path: '/onboarding',
            element: (
              <Suspense fallback={<PageFallback />}>
                <OnboardingPage />
              </Suspense>
            ),
          },
          {
            path: '/session-expired',
            element: (
              <Suspense fallback={<PageFallback />}>
                <SessionExpiredPage />
              </Suspense>
            ),
          },
          {
            // Receives token from backend after Google OAuth
            path: '/auth/callback',
            element: (
              <Suspense fallback={<PageFallback />}>
                <OAuthCallbackPage />
              </Suspense>
            ),
          },
        ],
      },
    ],
  },

  // Protected App Shell Routes
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: '/',
        element: <AppShell />,
        children: [
          {
            index: true,
            element: (
              <Suspense fallback={<PageFallback />}>
                <DashboardPage />
              </Suspense>
            ),
          },
          {
            path: 'assistant',
            element: (
              <Suspense fallback={<PageFallback />}>
                <AIAssistantPage />
              </Suspense>
            ),
          },
          {
            path: 'knowledge-base',
            element: (
              <Suspense fallback={<PageFallback />}>
                <KnowledgeBasePage />
              </Suspense>
            ),
          },
          {
            path: 'documents',
            element: (
              <Suspense fallback={<PageFallback />}>
                <DocumentsPage />
              </Suspense>
            ),
          },
          {
            path: 'recommendations',
            element: (
              <Suspense fallback={<PageFallback />}>
                <RecommendationsPage />
              </Suspense>
            ),
          },
          {
            path: 'analytics',
            element: (
              <Suspense fallback={<PageFallback />}>
                <AnalyticsPage />
              </Suspense>
            ),
          },
          {
            path: 'retrieval',
            element: (
              <Suspense fallback={<PageFallback />}>
                <RetrievalPage />
              </Suspense>
            ),
          },
          {
            path: 'agents/sales',
            element: (
              <Suspense fallback={<PageFallback />}>
                <SalesAgentPage />
              </Suspense>
            ),
          },
          {
            path: 'organizations',

            element: (
              <Suspense fallback={<PageFallback />}>
                <OrganizationsPage />
              </Suspense>
            ),
          },
          {
            path: 'organization/settings',
            element: (
              <Suspense fallback={<PageFallback />}>
                <OrganizationSettingsPage />
              </Suspense>
            ),
          },
          {
            path: 'settings',
            element: <SettingsLayout />,
            children: [
              { index: true, element: <Navigate to="general" replace /> },
              {
                path: 'general',
                element: (
                  <Suspense fallback={<PageFallback />}>
                    <SettingsPage />
                  </Suspense>
                ),
              },
              {
                path: 'notifications',
                element: (
                  <Suspense fallback={<PageFallback />}>
                    <SettingsPage />
                  </Suspense>
                ),
              },
              {
                path: 'security',
                element: (
                  <Suspense fallback={<PageFallback />}>
                    <SettingsPage />
                  </Suspense>
                ),
              },
              {
                path: 'profile',
                element: (
                  <Suspense fallback={<PageFallback />}>
                    <ProfilePage />
                  </Suspense>
                ),
              },
            ],
          },
        ],
      },
    ],
  },

  // Error Pages Layout
  {
    element: <ErrorLayout />,
    children: [
      {
        path: '/unauthorized',
        element: (
          <Suspense fallback={<PageFallback />}>
            <UnauthorizedPage />
          </Suspense>
        ),
      },
      {
        path: '*',
        element: (
          <Suspense fallback={<PageFallback />}>
            <NotFoundPage />
          </Suspense>
        ),
      },
    ],
  },
]);
