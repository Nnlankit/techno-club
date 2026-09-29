import React from 'react';
import { AlertTriangle, Info, X } from 'lucide-react';
import { Button } from './Button';

export interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose?: () => void;
  onCancel?: () => void;
  onConfirm: () => void | Promise<any>;
  title: string;
  message: string;
  confirmText?: string;
  confirmLabel?: string;
  cancelText?: string;
  variant?: 'danger' | 'primary';
  confirmVariant?: string;
  loading?: boolean;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onCancel,
  onConfirm,
  title,
  message,
  confirmText,
  confirmLabel,
  cancelText = 'Cancel',
  variant = 'danger',
  confirmVariant,
  loading = false,
}) => {
  const handleClose = onCancel || onClose || (() => {});
  const resolvedConfirmText = confirmLabel || confirmText || 'Confirm Action';
  const resolvedVariant = (confirmVariant === 'danger' || variant === 'danger') ? 'danger' : 'primary';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4 text-center">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
          onClick={handleClose}
        />

        {/* Modal Box */}
        <div className="relative transform overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 text-left shadow-2xl transition-all w-full max-w-md">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div
                className={`p-2.5 rounded-xl ${
                  resolvedVariant === 'danger'
                    ? 'bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400'
                    : 'bg-amber-100/80 text-amber-800 dark:bg-amber-950 dark:text-amber-400'
                }`}
              >
                {resolvedVariant === 'danger' ? (
                  <AlertTriangle className="w-5 h-5" />
                ) : (
                  <Info className="w-5 h-5" />
                )}
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {title}
              </h3>
            </div>
            <button
              onClick={handleClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="mt-3 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            {message}
          </p>

          <div className="mt-6 flex items-center justify-end gap-2.5">
            <Button variant="outline" size="sm" onClick={handleClose} disabled={loading}>
              {cancelText}
            </Button>
            <Button
              variant={resolvedVariant === 'danger' ? 'danger' : 'primary'}
              size="sm"
              onClick={onConfirm}
              loading={loading}
            >
              {resolvedConfirmText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
