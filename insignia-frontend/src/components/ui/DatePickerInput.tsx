import React, { useRef } from 'react';
import { Calendar, X } from 'lucide-react';
import { parseDisplayDateToIso, formatIsoToDisplayDate } from '@/utils/masking';

export interface DatePickerInputProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  variant?: 'default' | 'register';
  leftIcon?: boolean;
  outputFormat?: 'display' | 'iso';
  max?: string;
  min?: string;
  error?: string;
  helperText?: string;
}

export const DatePickerInput: React.FC<DatePickerInputProps> = ({
  label,
  value,
  onChange,
  placeholder = 'Select date...',
  disabled = false,
  required = false,
  className = '',
  variant = 'default',
  leftIcon = false,
  outputFormat = 'display',
  max,
  min,
  error,
  helperText,
}) => {
  const nativeDateInputRef = useRef<HTMLInputElement>(null);

  const isoValue = parseDisplayDateToIso(value);

  const handleNativeDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val) {
      if (outputFormat === 'iso') {
        onChange(val);
      } else {
        onChange(formatIsoToDisplayDate(val));
      }
    } else {
      onChange('');
    }
  };

  const openPicker = () => {
    if (disabled) return;
    try {
      nativeDateInputRef.current?.showPicker();
    } catch {
      nativeDateInputRef.current?.focus();
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    if (nativeDateInputRef.current) {
      nativeDateInputRef.current.value = '';
    }
  };

  const isRegister = variant === 'register';

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label
          className={`block mb-1.5 ${
            isRegister
              ? 'text-[11px] font-bold text-navy-900 uppercase tracking-wide'
              : 'text-xs font-semibold uppercase tracking-wider text-navy-700'
          }`}
        >
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      <div
        onClick={openPicker}
        className={`relative flex items-center rounded-xl cursor-pointer transition-all ${
          isRegister
            ? 'border border-indigo-100/90 bg-[#f4f7fe]/80 hover:border-brand-300 focus-within:bg-white focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20'
            : 'border border-slate-200 bg-white hover:border-slate-300 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20 shadow-2xs'
        } ${disabled ? 'opacity-60 cursor-not-allowed bg-slate-50' : ''} ${
          error ? 'border-rose-400 focus-within:border-rose-500 focus-within:ring-rose-500/20' : ''
        }`}
      >
        {/* Left Calendar Icon */}
        {leftIcon && (
          <div className="pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Calendar className="w-4 h-4" />
          </div>
        )}

        {/* Display Text Input */}
        <input
          type="text"
          readOnly
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={`w-full bg-transparent py-2.5 text-xs sm:text-sm font-medium cursor-pointer focus:outline-none ${
            leftIcon ? 'pl-2.5' : 'pl-3.5'
          } ${value ? 'text-navy-900' : 'text-slate-400'} pr-16`}
        />

        {/* Hidden Native Date Input that provides the Calendar Picker */}
        <input
          ref={nativeDateInputRef}
          type="date"
          value={isoValue}
          max={max}
          min={min}
          onChange={handleNativeDateChange}
          disabled={disabled}
          tabIndex={-1}
          aria-hidden="true"
          className="sr-only"
        />

        {/* Right Action Icons */}
        <div className="absolute right-3 flex items-center gap-1.5">
          {value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              title="Clear date"
              className="text-slate-400 hover:text-slate-600 p-0.5 rounded transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={openPicker}
            disabled={disabled}
            aria-label="Open Calendar Date Picker"
            className="text-slate-400 hover:text-brand-600 transition-colors p-0.5"
          >
            <Calendar className="w-4 h-4 text-brand-600" />
          </button>
        </div>
      </div>

      {error && <p className="mt-1 text-xs text-rose-500 font-medium">{error}</p>}
      {helperText && !error && <p className="mt-1 text-xs text-slate-400">{helperText}</p>}
    </div>
  );
};
