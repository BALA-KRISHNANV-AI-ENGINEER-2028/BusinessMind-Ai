import { useCallback, useState } from 'react';
import { RouterProvider } from 'react-router-dom';
import { ThemeProvider } from './providers/ThemeProvider';
import { QueryProvider } from './providers/QueryProvider';
import { LoadingProvider } from './providers/LoadingProvider';
import { AuthProvider } from '../contexts/AuthContext';
import { UserProvider } from '../contexts/UserContext';
import { OrganizationProvider } from '../contexts/OrganizationContext';
import { PermissionProvider } from '../contexts/PermissionContext';
import { SidebarProvider } from '../contexts/SidebarContext';
import { ToastProvider } from '../components/ui/Toast';
import { ErrorBoundary } from '../components/ui/ErrorBoundary';
import { StartupScreen } from '../components/startup/StartupScreen';
import { useAppInitializer } from '../hooks/useAppInitializer';
import { router } from './router';

/**
 * AppContent
 *
 * Manages the startup → application transition.
 * The StartupScreen renders during initialization and fades out
 * once all real async tasks have completed.
 */
function AppContent() {
  const initState = useAppInitializer();
  const [showStartup, setShowStartup] = useState(true);

  const handleStartupComplete = useCallback(() => {
    setShowStartup(false);
  }, []);

  return (
    <>
      {showStartup && (
        <StartupScreen
          initState={initState}
          onComplete={handleStartupComplete}
        />
      )}
      {initState.isReady && (
        <QueryProvider>
          <LoadingProvider>
            <AuthProvider>
              <UserProvider>
                <OrganizationProvider>
                  <PermissionProvider>
                    <SidebarProvider>
                      <ToastProvider>
                        <RouterProvider router={router} />
                      </ToastProvider>
                    </SidebarProvider>
                  </PermissionProvider>
                </OrganizationProvider>
              </UserProvider>
            </AuthProvider>
          </LoadingProvider>
        </QueryProvider>
      )}
    </>
  );
}

export function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </ErrorBoundary>
  );
}
