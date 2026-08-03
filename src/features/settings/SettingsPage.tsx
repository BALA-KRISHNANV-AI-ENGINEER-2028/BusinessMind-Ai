import { useLocation } from 'react-router-dom';
import { AppearanceSettings } from './components/AppearanceSettings';
import { NotificationSettings } from './components/NotificationSettings';
import { SecuritySettings } from './components/SecuritySettings';

export function SettingsPage() {
  const { pathname } = useLocation();

  if (pathname.includes('notifications')) {
    return <NotificationSettings />;
  }

  if (pathname.includes('security')) {
    return <SecuritySettings />;
  }

  // Default: /settings/general
  return <AppearanceSettings />;
}
