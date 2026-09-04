import React from 'react';
import { AlertCircle, CheckCircle2, Info, XCircle, X } from 'lucide-react';

export interface AlertProps {
  type?: 'success' | 'error' | 'info' | 'warning';
  title?: string;
  message: string;
  onClose?: () => void;
  className?: string;
}

/**
 * Vichy Design System Alert notification component
 */
export const Alert: React.FC<AlertProps> = ({
  type = 'info',
  title,
  message,
  onClose,
  className = '',
}) => {
  const configs = {
    success: {
      bg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />,
    },
    error: {
      bg: 'bg-rose-50 border-rose-200 text-rose-800',
      icon: <XCircle className="w-5 h-5 text-rose-600 shrink-0" />,
    },
    warning: {
      bg: 'bg-amber-50 border-amber-200 text-amber-800',
      icon: <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />,
    },
    info: {
      bg: 'bg-[#05AD98]/10 border-[#05AD98]/20 text-[#035D52]',
      icon: <Info className="w-5 h-5 text-[#05AD98] shrink-0" />,
    },
  };

  const config = configs[type];

  return (
    <div
      className={`flex items-start gap-3 p-3.5 rounded-lg border text-sm transition-all animate-fadeIn ${config.bg} ${className}`}
      role="alert"
    >
      {config.icon}
      <div className="flex-1 min-w-0">
        {title && <h5 className="font-semibold text-sm mb-0.5">{title}</h5>}
        <p className="text-xs leading-relaxed opacity-90">{message}</p>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-current opacity-60 hover:opacity-100 transition-opacity p-0.5 rounded cursor-pointer"
          aria-label="Close alert"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
