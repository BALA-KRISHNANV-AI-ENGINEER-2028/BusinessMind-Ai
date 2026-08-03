import { Link } from 'react-router-dom';
import { Bot, Upload, BarChart3, Building2 } from 'lucide-react';
import { cn } from '../../../lib/utils';

const actions = [
  { label: 'Ask AI Assistant', path: '/assistant', icon: Bot },
  { label: 'Upload document', path: '/documents', icon: Upload },
  { label: 'View analytics', path: '/analytics', icon: BarChart3 },
  { label: 'Manage organizations', path: '/organizations', icon: Building2 },
];

export function QuickActions() {
  return (
    <div className="grid grid-cols-2 gap-2">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <Link
            key={action.path}
            to={action.path}
            className={cn(
              'flex flex-col items-start gap-2 rounded-md border border-border p-3 transition-colors duration-150',
              'hover:border-border-strong hover:bg-bg-subtle',
            )}
          >
            <span className="flex size-8 items-center justify-center rounded-md bg-accent-subtle text-accent-text">
              <Icon size={16} aria-hidden="true" />
            </span>
            <span className="text-sm font-medium text-text-primary">{action.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
