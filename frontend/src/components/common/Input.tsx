import React, { forwardRef } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

/**
 * Vichy Design System Input Field
 * Styled with crisp borders (#BBBFBF), muted placeholder (#878787), and brand focus ring (#05AD98)
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, leftIcon, rightIcon, className = '', id, ...props }, ref) => {
    // Generate fallback unique id for label-input association
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5"
          >
            {label}
            {props.required && <span className="text-[#05AD98] ml-0.5">*</span>}
          </label>
        )}

        <div className="relative rounded-lg shadow-sm">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#878787]">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            className={`
              block w-full rounded-lg text-sm bg-white text-slate-900 placeholder-[#878787]
              border transition-all duration-150
              ${leftIcon ? 'pl-10' : 'pl-3.5'}
              ${rightIcon ? 'pr-10' : 'pr-3.5'}
              py-2.5
              ${
                error
                  ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-200'
                  : 'border-[#BBBFBF] hover:border-slate-400 focus:border-[#05AD98] focus:ring-2 focus:ring-[#05AD98]/20 focus:outline-none'
              }
              disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed
              ${className}
            `}
            {...props}
          />

          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              {rightIcon}
            </div>
          )}
        </div>

        {error && (
          <p className="mt-1 text-xs text-rose-600 flex items-center gap-1 font-medium">
            <span>•</span> {error}
          </p>
        )}

        {!error && helperText && (
          <p className="mt-1 text-xs text-[#878787]">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
