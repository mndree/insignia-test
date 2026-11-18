import React from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { TransactionDirection } from '@/types';
import { Search, RotateCcw, Filter, Calendar } from 'lucide-react';

interface TransactionFiltersProps {
  searchTerm: string;
  direction: TransactionDirection;
  dateFrom: string;
  dateTo: string;
  onSearchChange: (value: string) => void;
  onDirectionChange: (dir: TransactionDirection) => void;
  onDateFromChange: (date: string) => void;
  onDateToChange: (date: string) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

export const TransactionFilters: React.FC<TransactionFiltersProps> = ({
  searchTerm,
  direction,
  dateFrom,
  dateTo,
  onSearchChange,
  onDirectionChange,
  onDateFromChange,
  onDateToChange,
  onClearFilters,
  hasActiveFilters,
}) => {
  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Search Input */}
        <div>
          <Input
            label="Search Counterparty / ID"
            type="text"
            placeholder="e.g. azra or TXN-9021"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>

        {/* Direction Filter */}
        <div>
          <label
            htmlFor="directionSelect"
            className="block text-xs font-semibold uppercase tracking-wider text-navy-700 mb-1.5"
          >
            Transfer Direction
          </label>
          <div className="relative">
            <select
              id="directionSelect"
              value={direction}
              onChange={(e) => onDirectionChange(e.target.value as TransactionDirection)}
              className="w-full bg-white text-navy-900 border border-slate-300 rounded-lg px-3 py-2 text-sm transition-colors hover:border-slate-400 focus-ring cursor-pointer"
            >
              <option value="all">All Directions</option>
              <option value="incoming">Incoming Only (+)</option>
              <option value="outgoing">Outgoing Only (-)</option>
            </select>
            <Filter className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
          </div>
        </div>

        {/* Date From */}
        <div>
          <Input
            label="From Date"
            type="date"
            value={dateFrom}
            onChange={(e) => onDateFromChange(e.target.value)}
            leftIcon={<Calendar className="w-4 h-4" />}
          />
        </div>

        {/* Date To */}
        <div>
          <Input
            label="To Date"
            type="date"
            value={dateTo}
            onChange={(e) => onDateToChange(e.target.value)}
            leftIcon={<Calendar className="w-4 h-4" />}
          />
        </div>
      </div>

      {hasActiveFilters && (
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
          <span className="text-slate-500">Filters applied</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="text-slate-500 hover:text-navy-900 gap-1.5 h-7 px-2"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset all filters
          </Button>
        </div>
      )}
    </div>
  );
};
