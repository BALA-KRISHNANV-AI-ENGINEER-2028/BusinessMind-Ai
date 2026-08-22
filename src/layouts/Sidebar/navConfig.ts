import {
  LayoutDashboard,
  Bot,
  TrendingUp,
  BookOpen,
  FileText,
  Lightbulb,
  BarChart3,
  Building2,
  Settings,
} from 'lucide-react';
import type { NavItem } from '../../types/navigation';

export const primaryNavItems: NavItem[] = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard },
  { label: 'AI Assistant', path: '/assistant', icon: Bot },
  { label: 'Sales Agent', path: '/agents/sales', icon: TrendingUp },
  { label: 'Knowledge Base', path: '/knowledge-base', icon: BookOpen },
  { label: 'Documents', path: '/documents', icon: FileText },
  { label: 'Recommendations', path: '/recommendations', icon: Lightbulb },
  { label: 'Analytics', path: '/analytics', icon: BarChart3 },
  { label: 'Organizations', path: '/organizations', icon: Building2 },
];

export const secondaryNavItems: NavItem[] = [{ label: 'Settings', path: '/settings', icon: Settings }];
