import { Outlet } from 'react-router-dom';

export function AuthLayout() {
  return (
    <div className="flex min-h-svh w-full flex-col items-center justify-center bg-bg-subtle p-4">
      <div className="mb-6 flex items-center gap-2">
        <img
          src="/logo-app-icon.png"
          alt="BusinessMind AI"
          style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'contain', flexShrink: 0 }}
        />
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
