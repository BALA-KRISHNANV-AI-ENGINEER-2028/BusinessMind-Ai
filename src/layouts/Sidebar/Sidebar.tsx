import { NavLink } from 'react-router-dom';
import { ChevronsLeft, ChevronsRight, X, Brain } from 'lucide-react';
import { cn } from '../../lib/utils';
import { primaryNavItems, secondaryNavItems } from './navConfig';
import type { NavItem } from '../../types/navigation';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  /** Mobile drawer state — sidebar renders as an overlay when true. */
  mobileOpen: boolean;
  onMobileClose: () => void;
}

function NavLinkItem({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.path}
      end={item.path === '/'}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors duration-150',
          'text-text-secondary hover:bg-bg-muted hover:text-text-primary',
          isActive && 'bg-accent-subtle text-accent-text hover:bg-accent-subtle hover:text-accent-text',
          collapsed && 'justify-center px-0',
        )
      }
      title={collapsed ? item.label : undefined}
    >
      <Icon size={18} className="shrink-0" aria-hidden="true" />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </NavLink>
  );
}

export function Sidebar({ collapsed, onToggleCollapsed, mobileOpen, onMobileClose }: SidebarProps) {
  const content = (
    <div className="flex h-full flex-col bg-bg-subtle">
      <div
        className={cn(
          'flex h-14 items-center gap-2 border-b border-border px-4',
          collapsed && 'justify-center px-0',
        )}
      >
        <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-accent text-text-on-accent">
          <Brain size={16} aria-hidden="true" />
        </div>
        {!collapsed && (
          <span className="truncate text-sm font-semibold text-text-primary">BusinessMind AI</span>
        )}
        <button
          type="button"
          onClick={onMobileClose}
          className="ml-auto rounded-md p-1 text-text-secondary hover:bg-bg-muted lg:hidden"
          aria-label="Close navigation"
        >
          <X size={18} aria-hidden="true" />
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-3" aria-label="Primary">
        {primaryNavItems.map((item) => (
          <NavLinkItem key={item.path} item={item} collapsed={collapsed} />
        ))}
      </nav>

      <div className="space-y-1 border-t border-border px-2 py-3">
        {secondaryNavItems.map((item) => (
          <NavLinkItem key={item.path} item={item} collapsed={collapsed} />
        ))}
        <button
          type="button"
          onClick={onToggleCollapsed}
          className={cn(
            'hidden w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-text-secondary transition-colors duration-150 hover:bg-bg-muted hover:text-text-primary lg:flex',
            collapsed && 'justify-center px-0',
          )}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronsRight size={18} aria-hidden="true" /> : <ChevronsLeft size={18} aria-hidden="true" />}
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          'hidden shrink-0 border-r border-border transition-[width] duration-200 lg:block',
          collapsed ? 'w-16' : 'w-64',
        )}
      >
        {content}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-bg-overlay"
            onClick={onMobileClose}
            aria-hidden="true"
          />
          <aside className="relative z-50 h-full w-64 shadow-md" role="dialog" aria-modal="true">
            {content}
          </aside>
        </div>
      )}
    </>
  );
}
