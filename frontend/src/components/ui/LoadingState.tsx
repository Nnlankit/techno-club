import React from 'react';

export interface LoadingStateProps {
  message?: string;
  type?: 'spinner' | 'skeleton' | 'cards' | 'table';
  count?: number;
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading platform data...',
  type = 'skeleton',
  count = 4,
  className = '',
}) => {
  if (type === 'spinner') {
    return (
      <div className={`flex flex-col items-center justify-center p-12 space-y-3 ${className}`}>
        <div className="w-8 h-8 border-3 border-amber-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{message}</span>
      </div>
    );
  }

  if (type === 'cards') {
    return (
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 animate-pulse space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-3 w-20 bg-slate-200 dark:bg-slate-800 rounded-md" />
              <div className="h-8 w-8 bg-slate-200 dark:bg-slate-800 rounded-xl" />
            </div>
            <div className="h-7 w-28 bg-slate-200 dark:bg-slate-800 rounded-md" />
            <div className="h-3 w-36 bg-slate-200 dark:bg-slate-800 rounded-md" />
          </div>
        ))}
      </div>
    );
  }

  if (type === 'table') {
    return (
      <div className={`rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3 animate-pulse ${className}`}>
        <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-xl" />
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="h-12 bg-slate-50 dark:bg-slate-800/50 rounded-xl" />
        ))}
      </div>
    );
  }

  // Default Skeleton block
  return (
    <div className={`space-y-4 animate-pulse ${className}`}>
      <div className="h-6 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg" />
      <div className="h-4 w-72 bg-slate-100 dark:bg-slate-800/60 rounded-md" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
        <div className="h-32 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
        <div className="h-32 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
        <div className="h-32 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
      </div>
      <div className="h-64 bg-slate-100 dark:bg-slate-800 rounded-2xl mt-4" />
    </div>
  );
};
