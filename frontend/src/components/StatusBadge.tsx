import React from 'react';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const getBadgeStyle = (val: string) => {
    const s = val.toLowerCase();
    if (s.includes('active') || s.includes('approved') || s.includes('confirmed') || s.includes('completed') || s.includes('registered') || s.includes('winner')) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800';
    }
    if (s.includes('progress') || s.includes('ongoing') || s.includes('review') || s.includes('open') || s.includes('negotiation')) {
      return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800';
    }
    if (s.includes('pending') || s.includes('proposal') || s.includes('planning') || s.includes('draft') || s.includes('contacted') || s.includes('scheduled')) {
      return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800';
    }
    if (s.includes('urgent') || s.includes('critical') || s.includes('rejected') || s.includes('blocked') || s.includes('suspended') || s.includes('damaged') || s.includes('revoked')) {
      return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800';
    }
    return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getBadgeStyle(status)} ${className}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-70"></span>
      {status}
    </span>
  );
};
