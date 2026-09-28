import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon | React.ReactNode;
  color?: string; // e.g., 'blue', 'emerald', 'indigo', 'purple', 'rose', 'amber', 'cyan'
  trend?: {
    value: string;
    positive?: boolean;
  };
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  color = 'indigo',
  trend,
  onClick
}) => {
  const colorStyles: Record<string, { bg: string; text: string; iconBg: string }> = {
    indigo: {
      bg: 'hover:border-indigo-500/50',
      text: 'text-indigo-600 dark:text-indigo-400',
      iconBg: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400',
    },
    emerald: {
      bg: 'hover:border-emerald-500/50',
      text: 'text-emerald-600 dark:text-emerald-400',
      iconBg: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400',
    },
    blue: {
      bg: 'hover:border-blue-500/50',
      text: 'text-blue-600 dark:text-blue-400',
      iconBg: 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400',
    },
    amber: {
      bg: 'hover:border-amber-500/50',
      text: 'text-amber-600 dark:text-amber-400',
      iconBg: 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400',
    },
    purple: {
      bg: 'hover:border-purple-500/50',
      text: 'text-purple-600 dark:text-purple-400',
      iconBg: 'bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400',
    },
    rose: {
      bg: 'hover:border-rose-500/50',
      text: 'text-rose-600 dark:text-rose-400',
      iconBg: 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400',
    },
    cyan: {
      bg: 'hover:border-cyan-500/50',
      text: 'text-cyan-600 dark:text-cyan-400',
      iconBg: 'bg-cyan-50 text-cyan-600 dark:bg-cyan-950/60 dark:text-cyan-400',
    },
  };

  const style = colorStyles[color] || colorStyles.indigo;

  const renderIcon = () => {
    if (React.isValidElement(icon)) {
      return icon;
    }
    if (icon) {
      const Component = icon as React.ElementType;
      return <Component className="w-5 h-5" />;
    }
    return null;
  };

  return (
    <div
      onClick={onClick}
      className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:shadow-md' : ''
      } ${style.bg}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {title}
        </span>
        <div className={`p-2.5 rounded-xl ${style.iconBg}`}>
          {renderIcon()}
        </div>
      </div>
      <div className="mt-4 flex items-baseline justify-between">
        <div className="text-2xl font-bold text-slate-900 dark:text-white">
          {value}
        </div>
        {trend && (
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              trend.positive
                ? 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 dark:text-emerald-400'
                : 'text-rose-700 bg-rose-50 dark:bg-rose-950/50 dark:text-rose-400'
            }`}
          >
            {trend.value}
          </span>
        )}
      </div>
      {subtitle && (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {subtitle}
        </p>
      )}
    </div>
  );
};
