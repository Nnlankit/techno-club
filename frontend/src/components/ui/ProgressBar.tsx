import React from 'react';

export interface ProgressBarProps {
  progress?: number; // 0 to 100
  value?: number; // alias for progress
  label?: string;
  showPercentage?: boolean;
  size?: 'sm' | 'md' | 'lg';
  color?: 'blue' | 'emerald' | 'rose' | 'amber' | 'purple' | 'primary' | 'success' | 'danger' | 'warning';
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  value,
  label,
  showPercentage = true,
  size = 'md',
  color = 'blue',
  className = '',
}) => {
  const actualValue = progress !== undefined ? progress : value !== undefined ? value : 0;
  const clamped = Math.min(100, Math.max(0, actualValue));

  const heightStyles = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3',
  };

  const colorStyles: Record<string, string> = {
    blue: 'bg-blue-600',
    primary: 'bg-amber-600',
    emerald: 'bg-emerald-500',
    success: 'bg-emerald-500',
    rose: 'bg-rose-500',
    danger: 'bg-rose-500',
    amber: 'bg-amber-500',
    warning: 'bg-amber-500',
    purple: 'bg-purple-600',
  };

  return (
    <div className={`w-full space-y-1.5 ${className}`}>
      {(label || showPercentage) && (
        <div className="flex items-center justify-between text-xs font-semibold">
          {label && <span className="text-slate-700 dark:text-slate-300">{label}</span>}
          {showPercentage && <span className="text-slate-500 dark:text-slate-400 font-mono">{clamped}%</span>}
        </div>
      )}
      <div className={`w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden ${heightStyles[size]}`}>
        <div
          className={`${heightStyles[size]} ${colorStyles[color] || 'bg-amber-600'} rounded-full transition-all duration-500`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
};
