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
import { router } from './router';

export function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
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
      </ThemeProvider>
    </ErrorBoundary>
  );
}
