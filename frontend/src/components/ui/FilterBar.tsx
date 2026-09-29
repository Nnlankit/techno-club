import React from 'react';

export interface FilterBarProps {
  children?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  children,
  actions,
  className = '',
}) => {
  return (
    <div className={`flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 ${className}`}>
      <div className="flex flex-wrap items-center gap-2.5 flex-1">
        {children}
      </div>
      {actions && (
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          {actions}
        </div>
      )}
    </div>
  );
};
