import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Badge } from './Badge';

export interface CardProps {
  children?: React.ReactNode;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: LucideIcon | React.ReactNode;
  badge?: string;
  badgeVariant?: 'blue' | 'emerald' | 'rose' | 'amber' | 'purple' | 'slate';
  action?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  title,
  subtitle,
  icon,
  badge,
  badgeVariant,
  action,
  footer,
  className = '',
  onClick,
  hoverable = false,
}) => {
  const renderIcon = () => {
    if (!icon) return null;
    if (React.isValidElement(icon)) return icon;
    const IconComponent = icon as LucideIcon;
    return <IconComponent className="w-4 h-4 text-amber-700 dark:text-amber-400" />;
  };

  const hasHeader = title || subtitle || icon || badge || action;

  return (
    <div
      onClick={onClick}
      className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs transition-all duration-150 ${
        hoverable || onClick
          ? 'cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md'
          : ''
      } ${className}`}
    >
      {hasHeader && (
        <div className="p-4 sm:p-5 pb-3 border-b border-slate-100 dark:border-slate-800/80 flex items-start justify-between gap-3">
          <div className="flex items-start space-x-3 min-w-0">
            {icon && (
              <div className="p-2 rounded-xl bg-amber-100/80 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400 shrink-0">
                {renderIcon()}
              </div>
            )}
            <div className="min-w-0">
              {title && (
                <div className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                  {title}
                </div>
              )}
              {subtitle && (
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                  {subtitle}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            {badge && <Badge status={badge} variant={badgeVariant} />}
            {action}
          </div>
        </div>
      )}

      {children && <div className="p-4 sm:p-5">{children}</div>}

      {footer && (
        <div className="p-4 sm:p-5 pt-3 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/30 rounded-b-2xl">
          {footer}
        </div>
      )}
    </div>
  );
};
