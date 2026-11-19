import React from 'react';
import { ChevronDown } from 'lucide-react';

export interface TablePageSizeSelectorProps {
  pageSize: number;
  onPageSizeChange: (newSize: number) => void;
  options?: number[];
  label?: string;
  className?: string;
}

export const TablePageSizeSelector: React.FC<TablePageSizeSelectorProps> = ({
  pageSize,
  onPageSizeChange,
  options = [6, 10, 25, 50, 100],
  label = 'Show',
  className = '',
}) => {
  return (
    <div className={`inline-flex items-center gap-1.5 text-xs text-slate-500 ${className}`}>
      <span>{label}</span>
      <div className="relative inline-flex items-center">
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="appearance-none bg-white text-navy-900 border border-slate-200 rounded-lg pl-2.5 pr-7 py-1 text-xs font-semibold hover:border-slate-300 focus-ring cursor-pointer transition-colors"
          aria-label="Select number of entries to display"
        >
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 pointer-events-none" />
      </div>
      <span>entries</span>
    </div>
  );
};
