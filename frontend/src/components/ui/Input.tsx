import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  icon?: LucideIcon | React.ReactNode;
  iconPosition?: 'left' | 'right';
  badge?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({
  label,
  helperText,
  error,
  icon,
  iconPosition = 'left',
  badge,
  className = '',
  id,
  ...props
}, ref) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  const renderIcon = () => {
    if (!icon) return null;
    if (React.isValidElement(icon)) return icon;
    const IconComponent = icon as LucideIcon;
    return <IconComponent className="w-4 h-4 text-slate-400" />;
  };

  return (
    <div className="w-full space-y-1.5">
      {(label || badge) && (
        <div className="flex items-center justify-between">
          {label && (
            <label htmlFor={inputId} className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              {label}
            </label>
          )}
          {badge && (
            <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
              {badge}
            </span>
          )}
        </div>
      )}

      <div className="relative rounded-xl">
        {icon && iconPosition === 'left' && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            {renderIcon()}
          </div>
        )}

        <input
          ref={ref}
          id={inputId}
          className={`w-full text-xs sm:text-sm rounded-xl border transition-all duration-150 py-2.5 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none ${
            icon && iconPosition === 'left' ? 'pl-10' : 'pl-3.5'
          } ${
            icon && iconPosition === 'right' ? 'pr-10' : 'pr-3.5'
          } ${
            error
              ? 'border-rose-300 dark:border-rose-800 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 focus:border-amber-600 focus:ring-2 focus:ring-amber-600/20'
          } disabled:bg-slate-50 dark:disabled:bg-slate-950 disabled:text-slate-400 disabled:cursor-not-allowed ${className}`}
          {...props}
        />

        {icon && iconPosition === 'right' && (
          <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
            {renderIcon()}
          </div>
        )}
      </div>

      {error ? (
        <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-slate-500 dark:text-slate-400">{helperText}</p>
      ) : null}
    </div>
  );
});

Input.displayName = 'Input';
