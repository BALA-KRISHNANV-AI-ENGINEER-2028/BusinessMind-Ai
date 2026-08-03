import { Menu, Search, Sun, Moon, UserIcon, Settings, LogOut, Building } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../hooks/useTheme';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../contexts/AuthContext';
import { useUser } from '../../hooks/useUser';
import { Dropdown } from '../../components/ui/Dropdown';
import { Avatar } from '../../components/ui/Avatar';
import { OrganizationSwitcher } from '../../components/domain/OrganizationSwitcher';

interface TopNavProps {
  onOpenMobileSidebar: () => void;
}

export function TopNav({ onOpenMobileSidebar }: TopNavProps) {
  const { theme, toggleTheme } = useTheme();
  const { user } = useUser();
  const { logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    showToast({ title: 'Signed out', description: 'You have been signed out of your account.', variant: 'info' });
    navigate('/login');
  };

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-bg-base px-4">
      <button
        type="button"
        onClick={onOpenMobileSidebar}
        className="rounded-md p-1.5 text-text-secondary hover:bg-bg-muted lg:hidden"
        aria-label="Open navigation"
      >
        <Menu size={20} aria-hidden="true" />
      </button>

      {/* Organization Switcher */}
      <OrganizationSwitcher />

      {/* Search trigger */}
      <button
        type="button"
        className="hidden h-9 w-full max-w-xs items-center gap-2 rounded-md border border-border bg-bg-subtle px-3 text-sm text-text-secondary transition-colors duration-150 hover:border-border-strong sm:flex"
      >
        <Search size={16} className="shrink-0" aria-hidden="true" />
        <span className="flex-1 truncate text-left">Search</span>
        <kbd className="hidden shrink-0 rounded border border-border bg-bg-base px-1.5 py-0.5 text-xs text-text-disabled md:inline-block">
          ⌘K
        </kbd>
      </button>

      <div className="ml-auto flex items-center gap-1.5">
        <button
          type="button"
          onClick={toggleTheme}
          className="rounded-md p-2 text-text-secondary hover:bg-bg-muted hover:text-text-primary"
          aria-label={theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
        >
          {theme === 'light' ? <Moon size={18} aria-hidden="true" /> : <Sun size={18} aria-hidden="true" />}
        </button>

        <Dropdown
          triggerLabel="User menu"
          trigger={
            <Avatar name={user?.fullName || 'User'} src={user?.avatarUrl} size="sm" />
          }
          items={[
            { label: 'Profile', icon: <UserIcon size={16} aria-hidden="true" />, onSelect: () => navigate('/settings/profile') },
            { label: 'Organization Settings', icon: <Building size={16} aria-hidden="true" />, onSelect: () => navigate('/organization/settings') },
            { label: 'Workspace Settings', icon: <Settings size={16} aria-hidden="true" />, onSelect: () => navigate('/settings') },
            {
              label: 'Sign out',
              icon: <LogOut size={16} aria-hidden="true" />,
              onSelect: handleLogout,
              destructive: true,
            },
          ]}
        />
      </div>
    </header>
  );
}
