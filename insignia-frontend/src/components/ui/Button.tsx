import React, { ButtonHTMLAttributes } from 'react';
import { cn } from '@/utils/cn';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'success';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading = false, disabled, children, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus-ring disabled:opacity-50 disabled:cursor-not-allowed select-none';

    const variants = {
      primary: 'bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 shadow-sm',
      secondary: 'bg-slate-100 text-navy-800 hover:bg-slate-200 active:bg-slate-300',
      outline: 'border border-slate-300 bg-white text-navy-800 hover:bg-slate-50 active:bg-slate-100 shadow-sm',
      danger: 'bg-outgoing text-white hover:bg-outgoing-dark active:bg-red-700 shadow-sm',
      success: 'bg-incoming text-white hover:bg-incoming-dark shadow-sm',
      ghost: 'bg-transparent text-navy-700 hover:bg-slate-100 active:bg-slate-200',
    };

    const sizes = {
      sm: 'text-xs px-2.5 py-1.5 gap-1.5',
      md: 'text-sm px-4 py-2 gap-2',
      lg: 'text-base px-5 py-2.5 gap-2.5',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden="true" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
