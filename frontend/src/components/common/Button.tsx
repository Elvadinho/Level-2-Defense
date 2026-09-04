import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

/**
 * Vichy Design System Button Component
 * Features primary brand teal (#05AD98), refined hover states, and loading indicators
 */
export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  // Base styling for maximum utility, responsiveness, and clear tactile feel
  const baseClasses =
    'inline-flex items-center justify-center font-medium transition-all duration-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';

  // Sizing configurations
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-5 py-2.5 text-base gap-2.5',
  };

  // Variant styling matching the Vichy color specification (#05AD98, #BBBFBF, #878787, #FFFFFF)
  const variantClasses = {
    primary:
      'bg-[#05AD98] hover:bg-[#049381] text-white shadow-sm hover:shadow focus:ring-[#05AD98]/50 active:bg-[#037667]',
    secondary:
      'bg-slate-100 hover:bg-slate-200 text-slate-700 focus:ring-slate-400/50',
    outline:
      'border border-[#BBBFBF] hover:border-[#05AD98] hover:bg-[#05AD98]/5 text-slate-700 hover:text-[#05AD98] focus:ring-[#05AD98]/40',
    ghost:
      'text-slate-600 hover:text-[#05AD98] hover:bg-[#05AD98]/10 focus:ring-[#05AD98]/30',
    danger:
      'bg-rose-600 hover:bg-rose-700 text-white shadow-sm focus:ring-rose-500/50',
  };

  return (
    <button
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin text-current" />
          <span>Processing...</span>
        </>
      ) : (
        <>
          {leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
        </>
      )}
    </button>
  );
};
