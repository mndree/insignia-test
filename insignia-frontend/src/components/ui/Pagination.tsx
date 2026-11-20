import React from 'react';
import { Button } from './Button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface PaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  pageSizeOptions?: number[];
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50],
  className = '',
}) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-4 py-3 px-1 text-sm text-slate-600 ${className}`}
      aria-label="Pagination Navigation"
    >
      <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm">
        <span>
          Showing <span className="font-semibold text-navy-900">{startItem}</span> to{' '}
          <span className="font-semibold text-navy-900">{endItem}</span> of{' '}
          <span className="font-semibold text-navy-900">{totalItems}</span> results{' '}
          <span className="text-slate-400 font-medium">
            ({totalItems === 0 ? 0 : endItem - startItem + 1} on this page)
          </span>
        </span>

        <div className="flex items-center gap-1.5">
          <label htmlFor="pageSizeSelect" className="text-xs text-slate-500 hidden sm:inline">
            Per page:
          </label>
          <select
            id="pageSizeSelect"
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="text-xs font-medium bg-white border border-slate-300 rounded-md px-2 py-1 text-navy-900 focus-ring cursor-pointer hover:border-slate-400"
          >
            {pageSizeOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          aria-label="Previous Page"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Previous
        </Button>

        <span className="text-xs sm:text-sm px-2 font-medium text-navy-800">
          Page {currentPage} of {totalPages}
        </span>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          aria-label="Next Page"
        >
          Next
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
};
