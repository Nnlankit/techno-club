import React from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export interface ToastProps {
  id?: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  title?: string;
  message: string;
  onClose?: () => void;
  className?: string;
}

export const Toast: React.FC<ToastProps> = ({
  type = 'info',
  title,
  message,
  onClose,
  className = '',
}) => {
  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
    error: <AlertCircle className="w-5 h-5 text-rose-500" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />,
  };

  const bgStyles = {
    success: 'border-emerald-200 dark:border-emerald-800 bg-white dark:bg-slate-900',
    error: 'border-rose-200 dark:border-rose-800 bg-white dark:bg-slate-900',
    warning: 'border-amber-200 dark:border-amber-800 bg-white dark:bg-slate-900',
    info: 'border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-900',
  };

  return (
    <div
      role="alert"
      className={`flex items-start space-x-3 p-4 rounded-xl border shadow-lg max-w-sm ${bgStyles[type]} ${className}`}
    >
      <div className="shrink-0">{icons[type]}</div>
      <div className="flex-1 min-w-0">
        {title && (
          <h4 className="text-xs font-bold text-slate-900 dark:text-white">
            {title}
          </h4>
        )}
        <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
          {message}
        </p>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
