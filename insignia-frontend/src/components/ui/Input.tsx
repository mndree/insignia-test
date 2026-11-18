import React, { InputHTMLAttributes, forwardRef, useId } from 'react';
import { cn } from '@/utils/cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, leftIcon, rightIcon, id, disabled, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold uppercase tracking-wider text-navy-700 mb-1.5"
          >
            {label}
          </label>
        )}

        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3 flex items-center pointer-events-none text-slate-400">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : helperText ? helperId : undefined}
            className={cn(
              'w-full bg-white text-navy-900 border border-slate-300 rounded-lg px-3 py-2 text-sm transition-colors placeholder:text-slate-400 focus-ring',
              'hover:border-slate-400',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              error && 'border-outgoing focus:ring-outgoing',
              disabled && 'bg-slate-50 text-slate-400 cursor-not-allowed',
              className
            )}
            {...props}
          />

          {rightIcon && (
            <div className="absolute right-3 flex items-center">
              {rightIcon}
            </div>
          )}
        </div>

        {error && (
          <p id={errorId} className="mt-1 text-xs text-outgoing font-medium" role="alert">
            {error}
          </p>
        )}

        {helperText && !error && (
          <p id={helperId} className="mt-1 text-xs text-slate-500">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
