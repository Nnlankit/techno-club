import React from 'react';
import { Search } from 'lucide-react';
import { Button } from './Button';

export interface PageHeaderFilter {
  key: string;
  label?: string;
  value: string;
  onChange: (value: any) => void;
  options: Array<{ label: string; value: string }>;
}

export interface PageHeaderProps {
  title: string;
  description?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  primaryAction?: {
    label: string;
    icon?: React.ReactNode;
    onClick?: () => void;
    href?: string;
  };
  searchProps?: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
  };
  filterProps?: {
    filters: PageHeaderFilter[];
  };
  children?: React.ReactNode; // For additional custom controls
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  badge,
  actions,
  primaryAction,
  searchProps,
  filterProps,
  children,
  className = '',
}) => {
  return (
    <div className={`space-y-4 mb-6 ${className}`}>
      {/* Title & Top Actions Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {title}
            </h1>
            {badge}
          </div>
          {description && (
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              {description}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto">
          {actions}
          {primaryAction && (
            <Button
              variant="primary"
              size="md"
              icon={primaryAction.icon}
              onClick={primaryAction.onClick}
            >
              {primaryAction.label}
            </Button>
          )}
        </div>
      </div>

      {/* Built-in Search & Filter Bar (Section 9) */}
      {(searchProps || filterProps || children) && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
          <div className="flex flex-1 flex-col sm:flex-row sm:items-center gap-3">
            {searchProps && (
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={searchProps.value}
                  onChange={(e) => searchProps.onChange(e.target.value)}
                  placeholder={searchProps.placeholder || 'Search...'}
                  className="w-full text-xs pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-600/30 focus:border-amber-600"
                />
              </div>
            )}

            {filterProps?.filters.map((f) => (
              <div key={f.key} className="flex items-center space-x-1.5">
                {f.label && (
                  <span className="text-xs text-slate-500 hidden lg:inline whitespace-nowrap">
                    {f.label}:
                  </span>
                )}
                <select
                  value={f.value}
                  onChange={(e) => f.onChange(e.target.value)}
                  className="text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-600/30 focus:border-amber-600"
                >
                  {f.options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          {children && (
            <div className="flex items-center gap-2">
              {children}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
