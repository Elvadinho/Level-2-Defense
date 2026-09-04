import { LucideIcon } from 'lucide-react';
import { UserRole } from './auth';

/**
 * Navigation Item definition
 */
export interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: LucideIcon;
  badge?: string | number;
  roles: UserRole[]; // Which roles can access this navigation item
  description?: string;
}

/**
 * Navigation Group for categorizing sidebar links
 */
export interface NavGroup {
  title: string;
  items: NavItem[];
}
