import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '../Button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in ErrorBoundary:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex h-svh w-full flex-col items-center justify-center bg-bg-base p-6 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-danger-subtle text-danger">
            <AlertTriangle size={28} aria-hidden="true" />
          </div>
          <h1 className="mt-4 text-xl font-bold text-text-primary">Something went wrong</h1>
          <p className="mt-2 max-w-md text-sm text-text-secondary">
            An unexpected error occurred in the application. Please try refreshing the page or contact support if the problem persists.
          </p>
          {this.state.error && (
            <pre className="mt-4 max-w-lg overflow-x-auto rounded-md bg-bg-muted p-3 text-left text-xs font-mono text-text-secondary">
              {this.state.error.message}
            </pre>
          )}
          <div className="mt-6 flex gap-3">
            <Button variant="secondary" onClick={() => window.location.reload()}>
              <RefreshCw size={16} aria-hidden="true" />
              Reload Page
            </Button>
            <Button onClick={this.handleReset}>Try Again</Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
