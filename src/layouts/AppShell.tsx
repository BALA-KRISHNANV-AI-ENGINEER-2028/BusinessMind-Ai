import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar/Sidebar';
import { TopNav } from './TopNav/TopNav';
import { useSidebar } from '../hooks/useSidebar';

export function AppShell() {
  const { collapsed, toggleCollapsed, mobileOpen, closeMobile, openMobile } = useSidebar();

  return (
    <div className="flex h-svh bg-bg-base">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-text-on-accent"
      >
        Skip to main content
      </a>

      <Sidebar
        collapsed={collapsed}
        onToggleCollapsed={toggleCollapsed}
        mobileOpen={mobileOpen}
        onMobileClose={closeMobile}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopNav onOpenMobileSidebar={openMobile} />
        <main id="main-content" className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
