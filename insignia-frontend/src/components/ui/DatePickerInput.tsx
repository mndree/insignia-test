import React, { useRef } from 'react';
import { Calendar } from 'lucide-react';
import { parseDisplayDateToIso, formatIsoToDisplayDate } from '@/utils/masking';

export interface DatePickerInputProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

export const DatePickerInput: React.FC<DatePickerInputProps> = ({
  label,
  value,
  onChange,
  placeholder = '15 May 1996',
  disabled = false,
  required = false,
  className = '',
}) => {
  const nativeDateInputRef = useRef<HTMLInputElement>(null);

  const isoValue = parseDisplayDateToIso(value);

  const handleNativeDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      const formatted = formatIsoToDisplayDate(e.target.value);
      onChange(formatted);
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

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="block text-xs font-semibold text-navy-900">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      <div className="relative group">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          onClick={openPicker}
          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium text-navy-900 bg-white focus-ring pr-10 cursor-pointer disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
        />

        {/* Hidden native date input that provides the calendar dropdown */}
        <input
          ref={nativeDateInputRef}
          type="date"
          value={isoValue}
          onChange={handleNativeDateChange}
          disabled={disabled}
          tabIndex={-1}
          aria-hidden="true"
          className="absolute right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 opacity-0 cursor-pointer z-10"
        />

        <button
          type="button"
          onClick={openPicker}
          disabled={disabled}
          tabIndex={-1}
          aria-label="Open Calendar Picker"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-brand-600 transition-colors p-0.5 pointer-events-none"
        >
          <Calendar className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
