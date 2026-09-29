import React from 'react';

export interface ProgressCircleProps {
  progress: number; // 0 to 100
  size?: number; // diameter in px
  strokeWidth?: number;
  color?: 'blue' | 'emerald' | 'rose' | 'amber' | 'purple';
  children?: React.ReactNode;
  className?: string;
}

export const ProgressCircle: React.FC<ProgressCircleProps> = ({
  progress,
  size = 64,
  strokeWidth = 6,
  color = 'blue',
  children,
  className = '',
}) => {
  const clamped = Math.min(100, Math.max(0, progress));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clamped / 100) * circumference;

  const colorStyles = {
    blue: 'text-blue-600',
    emerald: 'text-emerald-500',
    rose: 'text-rose-500',
    amber: 'text-amber-500',
    purple: 'text-purple-600',
  };

  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          className="text-slate-100 dark:text-slate-800"
          stroke="currentColor"
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          className={`${colorStyles[color]} transition-all duration-500`}
          stroke="currentColor"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {children || <span className="text-xs font-bold font-mono">{clamped}%</span>}
      </div>
    </div>
  );
};
