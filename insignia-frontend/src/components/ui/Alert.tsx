import React, { HTMLAttributes } from 'react';
import { cn } from '@/utils/cn';
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';

export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  onClose?: () => void;
}

export const Alert: React.FC<AlertProps> = ({
  className,
  variant = 'info',
  title,
  children,
  onClose,
  ...props
}) => {
  const styles = {
    info: 'bg-blue-50 text-blue-900 border-blue-200/80',
    success: 'bg-emerald-50 text-emerald-900 border-emerald-200/80',
    warning: 'bg-amber-50 text-amber-900 border-amber-200/80',
    error: 'bg-rose-50 text-rose-900 border-rose-200/80',
  };

  const icons = {
    info: <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" aria-hidden="true" />,
    success: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />,
    error: <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" aria-hidden="true" />,
  };

  return (
    <div
      role="alert"
      className={cn(
        'relative flex items-start gap-3 p-4 rounded-xl border text-sm',
        styles[variant],
        className
      )}
      {...props}
    >
      {icons[variant]}
      <div className="flex-1">
        {title && <h5 className="font-semibold mb-1 leading-snug">{title}</h5>}
        <div className="text-sm opacity-90">{children}</div>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 transition-colors p-1 -mr-1 -mt-1 rounded focus-ring"
          aria-label="Dismiss alert"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
