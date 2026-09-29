import React from 'react';

export interface BadgeProps {
  status?: string;
  children?: React.ReactNode;
  variant?: 'blue' | 'emerald' | 'rose' | 'amber' | 'purple' | 'slate';
  size?: 'xs' | 'sm' | 'md';
  className?: string;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  status,
  children,
  variant,
  size = 'sm',
  className = '',
  dot = true,
}) => {
  const content = children || status || '';
  const text = String(content).toLowerCase();

  // Determine variant based on Section 13 & Semantic Color System
  let chosenVariant = variant;
  if (!chosenVariant) {
    // Green -> Success / Completed / Approved / Active
    if (
      text.includes('approved') ||
      text.includes('completed') ||
      text.includes('active') ||
      text.includes('confirmed') ||
      text.includes('winner') ||
      text.includes('verified')
    ) {
      chosenVariant = 'emerald';
    }
    // Red -> Rejected / Critical / Urgent / Blocked / Revoked
    else if (
      text.includes('rejected') ||
      text.includes('critical') ||
      text.includes('urgent') ||
      text.includes('blocked') ||
      text.includes('suspended') ||
      text.includes('closed')
    ) {
      chosenVariant = 'rose';
    }
    // Orange / Amber -> Warning / Pending / On Hold / Revision Required / Under Review / Submitted / Draft
    else if (
      text.includes('pending') ||
      text.includes('review') ||
      text.includes('hold') ||
      text.includes('revision') ||
      text.includes('draft') ||
      text.includes('submitted') ||
      text.includes('warning')
    ) {
      chosenVariant = 'amber';
    }
    // Blue -> In Progress / Ongoing / Registration Open / Planning / Information
    else if (
      text.includes('progress') ||
      text.includes('ongoing') ||
      text.includes('open') ||
      text.includes('planning') ||
      text.includes('todo')
    ) {
      chosenVariant = 'blue';
    }
    // Purple -> Special / Flagship / Hackathon / Secondary
    else if (
      text.includes('hackathon') ||
      text.includes('flagship') ||
      text.includes('special')
    ) {
      chosenVariant = 'purple';
    } else {
      chosenVariant = 'slate';
    }
  }

  const variantStyles = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800',
    rose: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800',
    amber: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800',
    purple: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-800',
    slate: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  };

  const sizeStyles = {
    xs: 'px-2 py-0.5 text-[10px]',
    sm: 'px-2.5 py-0.5 text-xs',
    md: 'px-3 py-1 text-xs',
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border transition-colors ${
        sizeStyles[size]
      } ${variantStyles[chosenVariant]} ${className}`}
    >
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 shrink-0 opacity-80" />}
      <span>{content}</span>
    </span>
  );
};
