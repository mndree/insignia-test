import React from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

export type SortOrder = 'asc' | 'desc' | null;

export interface TableColumnHeaderProps {
  label: string;
  field: string;
  currentSortField?: string | null;
  currentSortOrder?: SortOrder;
  onSort: (field: string) => void;
  align?: 'left' | 'right' | 'center';
  className?: string;
  children?: React.ReactNode;
}

export const TableColumnHeader: React.FC<TableColumnHeaderProps> = ({
  label,
  field,
  currentSortField,
  currentSortOrder,
  onSort,
  align = 'left',
  className = '',
  children,
}) => {
  const isSorted = currentSortField === field && Boolean(currentSortOrder);

  const getNextSortTitle = () => {
    if (!isSorted) return `Sort by ${label} ascending`;
    return currentSortOrder === 'asc'
      ? `Sort by ${label} descending`
      : `Sort by ${label} ascending`;
  };

  return (
    <th
      scope="col"
      className={`py-3.5 px-4 sm:px-6 select-none ${
        align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left'
      } ${className}`}
    >
      <button
        type="button"
        onClick={() => onSort(field)}
        className={`group inline-flex items-center gap-1.5 font-semibold text-[11px] uppercase tracking-wider transition-colors focus-ring rounded py-0.5 px-1 -mx-1 cursor-pointer ${
          isSorted
            ? 'text-brand-700 font-bold'
            : 'text-slate-500 hover:text-navy-900'
        } ${align === 'right' ? 'flex-row-reverse ml-auto' : align === 'center' ? 'mx-auto' : ''}`}
        title={getNextSortTitle()}
        aria-sort={
          isSorted
            ? currentSortOrder === 'asc'
              ? 'ascending'
              : 'descending'
            : 'none'
        }
      >
        <span>{children || label}</span>
        <span
          className={`p-0.5 rounded transition-all ${
            isSorted
              ? 'bg-brand-50 text-brand-600 ring-1 ring-brand-200'
              : 'text-slate-400 group-hover:text-slate-600'
          }`}
        >
          {isSorted ? (
            currentSortOrder === 'asc' ? (
              <ArrowUp className="w-3.5 h-3.5 text-brand-600 stroke-[2.5]" />
            ) : (
              <ArrowDown className="w-3.5 h-3.5 text-brand-600 stroke-[2.5]" />
            )
          ) : (
            <ArrowUpDown className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 transition-opacity" />
          )}
        </span>
      </button>
    </th>
  );
};
