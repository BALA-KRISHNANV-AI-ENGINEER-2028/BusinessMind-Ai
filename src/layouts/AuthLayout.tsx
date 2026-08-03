import { Outlet } from 'react-router-dom';
import { Brain } from 'lucide-react';

export function AuthLayout() {
  return (
    <div className="flex min-h-svh w-full flex-col items-center justify-center bg-bg-subtle p-4">
      <div className="mb-6 flex items-center gap-2">
        <div className="flex size-9 items-center justify-center rounded-lg bg-accent text-text-on-accent shadow-sm">
          <Brain size={22} aria-hidden="true" />
        </div>
        <span className="text-xl font-bold text-text-primary">BusinessMind AI</span>
      </div>
      <div className="w-full max-w-md">
        <Outlet />
      </div>
      <p className="mt-8 text-center text-xs text-text-secondary">
        &copy; {new Date().getFullYear()} BusinessMind AI. All rights reserved.
      </p>
    </div>
  );
}
