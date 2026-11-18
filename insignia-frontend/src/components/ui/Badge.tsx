import React, { HTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'danger' | 'warning' | 'info' | 'neutral';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'default',
  size = 'md',
  children,
  ...props
}) => {
  const variants = {
    default: 'bg-brand-50 text-brand-700 border border-brand-200/60',
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-200/60',
    danger: 'bg-rose-50 text-rose-700 border border-rose-200/60',
    warning: 'bg-amber-50 text-amber-700 border border-amber-200/60',
    info: 'bg-sky-50 text-sky-700 border border-sky-200/60',
    neutral: 'bg-slate-100 text-slate-700 border border-slate-200/60',
  };

  const sizes = {
    sm: 'text-[11px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full select-none gap-1',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
