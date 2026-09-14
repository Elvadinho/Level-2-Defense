import {
  LayoutDashboard,
  Users,
  Clock,
  FolderKanban,
  CheckSquare,
  Building2,
  FileText,
  Receipt,
  CreditCard,
  Bot,
  ShieldCheck,
} from 'lucide-react';
import { NavGroup, NavItem } from '../types/navigation';
import { UserRole } from '../types/auth';

/**
 * Complete definition of all ERP Modules with role-based access controls
 */
export const ALL_NAV_ITEMS: NavItem[] = [
  {
    id: 'user-accounts',
    label: 'User Accounts',
    path: '/users',
    icon: ShieldCheck,
    roles: ['admin'],
    description: 'Create, update, and manage access to user accounts',
  },
  {
    id: 'dashboard',
    label: 'Dashboard',
    path: '/dashboard',
    icon: LayoutDashboard,
    roles: ['admin', 'hr_manager', 'project_manager', 'employee', 'accountant', 'customer', 'intern'],
    description: 'System overview and core KPIs',
  },
  {
    id: 'employees',
    label: 'Employees',
    path: '/employees',
    icon: Users,
    roles: ['admin', 'hr_manager'],
    description: 'Staff profiles and departmental directory',
  },
  {
    id: 'attendance',
    label: 'Attendance',
    path: '/attendance',
    icon: Clock,
    roles: ['admin', 'hr_manager', 'project_manager', 'employee', 'intern'],
    description: 'Check-in/out, QR code verification & logs',
  },
  {
    id: 'projects',
    label: 'Projects',
    path: '/projects',
    icon: FolderKanban,
    roles: ['admin', 'project_manager', 'hr_manager'],
    description: 'Project planning, deadlines & team members',
  },
  {
    id: 'tasks',
    label: 'Tasks',
    path: '/tasks',
    icon: CheckSquare,
    roles: ['admin', 'project_manager', 'employee', 'hr_manager', 'intern'],
    description: 'Task assignments, boards & activity comments',
  },
  {
    id: 'customers',
    label: 'Customers',
    path: '/customers',
    icon: Building2,
    roles: ['admin', 'accountant'],
    description: 'Client directory and accounts',
  },
  {
    id: 'quotations',
    label: 'Quotations',
    path: '/quotations',
    icon: FileText,
    roles: ['admin', 'accountant', 'customer'],
    description: 'Customer quotes and estimates',
  },
  {
    id: 'invoices',
    label: 'Invoices',
    path: '/invoices',
    icon: Receipt,
    roles: ['admin', 'accountant', 'customer'],
    description: 'Billing and invoice tracking',
  },
  {
    id: 'payments',
    label: 'Payments',
    path: '/payments',
    icon: CreditCard,
    roles: ['admin', 'accountant', 'customer'],
    description: 'Mobile Money, Card & Bank transfers',
  },
  {
    id: 'ai-assistant',
    label: 'AI Assistant',
    path: '/assistant',
    icon: Bot,
    roles: ['admin', 'hr_manager', 'project_manager', 'employee', 'accountant', 'intern'],
    description: 'Intelligent business assistant',
  },
];

/**
 * Roles granted access to a module.
 * Routes reuse this helper so the sidebar and the route guards can never drift apart.
 */
export const getRolesForModule = (moduleId: string): UserRole[] =>
  ALL_NAV_ITEMS.find((item) => item.id === moduleId)?.roles || [];

/**
 * Filter navigation items accessible to a given role
 */
export const getNavItemsForRole = (role?: UserRole): NavItem[] => {
  if (!role) return [];
  return ALL_NAV_ITEMS.filter((item) => item.roles.includes(role));
};

/**
 * Grouped navigation structure for organized sidebar display
 */
export const getNavGroupsForRole = (role?: UserRole): NavGroup[] => {
  const allowed = getNavItemsForRole(role);

  const groups: NavGroup[] = [
    {
      title: 'Main',
      items: allowed.filter((item) => item.id === 'dashboard'),
    },
    {
      title: 'Operations',
      items: allowed.filter((item) =>
        ['employees', 'user-accounts', 'attendance', 'projects', 'tasks'].includes(item.id)
      ),
    },
    {
      title: 'Finance & Sales',
      items: allowed.filter((item) =>
        ['customers', 'quotations', 'invoices', 'payments'].includes(item.id)
      ),
    },
    {
      title: 'Intelligence',
      items: allowed.filter((item) => ['ai-assistant'].includes(item.id)),
    },
  ];

  // Return only non-empty groups
  return groups.filter((group) => group.items.length > 0);
};
