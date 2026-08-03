import { NavLink, Outlet } from 'react-router-dom';
import { cn } from '../lib/utils';

const settingsNav = [
  { label: 'General', path: '/settings/general' },
  { label: 'Notifications', path: '/settings/notifications' },
  { label: 'Security', path: '/settings/security' },
  { label: 'Profile', path: '/settings/profile' },
];

export function SettingsLayout() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-text-primary">Settings</h1>
        <p className="text-sm text-text-secondary">Manage your workspace preferences and profile.</p>
      </div>

      <div className="flex gap-1 overflow-x-auto border-b border-border">
        {settingsNav.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                'border-b-2 px-3 py-2 text-sm font-medium transition-colors duration-150',
                isActive
                  ? 'border-accent-text text-accent-text'
                  : 'border-transparent text-text-secondary hover:text-text-primary',
              )
            }
          >
            {item.label}
          </NavLink>
        ))}
      </div>

      <div className="pt-2">
        <Outlet />
      </div>
    </div>
  );
}
