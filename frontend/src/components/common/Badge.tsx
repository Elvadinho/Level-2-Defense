import React from 'react';
import { UserRole } from '../../types/auth';

export interface BadgeProps {
  children?: React.ReactNode;
  variant?: 'primary' | 'silver' | 'gray' | 'success' | 'warning' | 'danger';
  role?: UserRole;
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * Human-readable mapping for roles
 */
export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrator',
  hr_manager: 'HR Manager',
  project_manager: 'Project Manager',
  employee: 'Employee',
  accountant: 'Accountant',
  customer: 'Customer',
  intern: 'Intern',
};

/**
 * Badge Component for tags, role indicators, and status chips
 */
export const Badge: React.FC<BadgeProps> = ({
  children,
  variant,
  role,
  size = 'md',
  className = '',
}) => {
  // If role is supplied, auto-assign specific harmonious color scheme
  let variantClass = 'bg-slate-100 text-slate-700 border-slate-200';

  if (role) {
    switch (role) {
      case 'admin':
        variantClass = 'bg-purple-50 text-purple-700 border-purple-200';
        break;
      case 'hr_manager':
        variantClass = 'bg-blue-50 text-blue-700 border-blue-200';
        break;
      case 'project_manager':
        variantClass = 'bg-[#05AD98]/15 text-[#035D52] border-[#05AD98]/30';
        break;
      case 'accountant':
        variantClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        break;
      case 'customer':
        variantClass = 'bg-indigo-50 text-indigo-700 border-indigo-200';
        break;
      case 'employee':
      default:
        variantClass = 'bg-slate-100 text-slate-700 border-slate-300';
        break;
    }
  } else if (variant) {
    switch (variant) {
      case 'primary':
        variantClass = 'bg-[#05AD98]/10 text-[#049381] border-[#05AD98]/25';
        break;
      case 'silver':
        variantClass = 'bg-[#BBBFBF]/20 text-slate-700 border-[#BBBFBF]/40';
        break;
      case 'gray':
        variantClass = 'bg-slate-100 text-[#878787] border-slate-200';
        break;
      case 'success':
        variantClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        break;
      case 'warning':
        variantClass = 'bg-amber-50 text-amber-700 border-amber-200';
        break;
      case 'danger':
        variantClass = 'bg-rose-50 text-rose-700 border-rose-200';
        break;
    }
  }

  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border tracking-wide uppercase ${sizeClass} ${variantClass} ${className}`}
    >
      {role ? ROLE_LABELS[role] : children}
    </span>
  );
};
