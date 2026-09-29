import React from 'react';
import { LucideIcon, Sparkles } from 'lucide-react';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: LucideIcon | React.ReactNode;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  actionIcon?: LucideIcon | React.ReactNode;
  action?: {
    label: string;
    onClick?: () => void;
    icon?: React.ReactNode;
  };
  secondaryActionText?: string;
  onSecondaryAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionText,
  onAction,
  actionIcon,
  action,
  secondaryActionText,
  onSecondaryAction,
  className = '',
}) => {
  const renderIcon = () => {
    if (!icon) {
      return <Sparkles className="w-6 h-6 text-slate-400" />;
    }
    if (React.isValidElement(icon)) return icon;
    const IconComponent = icon as LucideIcon;
    return <IconComponent className="w-6 h-6 text-slate-400" />;
  };

  const finalActionText = action?.label || actionText;
  const finalActionClick = action?.onClick || onAction;
  const finalActionIcon = action?.icon || actionIcon;

  return (
    <div className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 ${className}`}>
      <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4 text-slate-500">
        {renderIcon()}
      </div>
      <h3 className="text-base font-bold text-slate-900 dark:text-white">
        {title}
      </h3>
      <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm">
        {description}
      </p>

      {(finalActionClick || onSecondaryAction) && (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
          {finalActionText && finalActionClick && (
            <Button
              variant="primary"
              size="sm"
              icon={finalActionIcon}
              onClick={finalActionClick}
            >
              {finalActionText}
            </Button>
          )}

          {secondaryActionText && onSecondaryAction && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onSecondaryAction}
            >
              {secondaryActionText}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
