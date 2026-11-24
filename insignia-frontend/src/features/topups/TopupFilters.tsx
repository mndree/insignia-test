import React from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { DatePickerInput } from '@/components/ui/DatePickerInput';
import { Search, RotateCcw } from 'lucide-react';

interface TopupFiltersProps {
  searchTerm: string;
  dateFrom: string;
  dateTo: string;
  onSearchChange: (value: string) => void;
  onDateFromChange: (date: string) => void;
  onDateToChange: (date: string) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

export const TopupFilters: React.FC<TopupFiltersProps> = ({
  searchTerm,
  dateFrom,
  dateTo,
  onSearchChange,
  onDateFromChange,
  onDateToChange,
  onClearFilters,
  hasActiveFilters,
}) => {
  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Search Input */}
        <div>
          <Input
            label="Search Recipient / Top-up ID"
            type="text"
            placeholder="e.g. andre, TOP-0001 or memo"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>

        {/* Date From */}
        <div>
          <DatePickerInput
            label="From Date"
            value={dateFrom}
            onChange={onDateFromChange}
            placeholder="YYYY-MM-DD"
            outputFormat="iso"
            leftIcon={true}
          />
        </div>

        {/* Date To */}
        <div>
          <DatePickerInput
            label="To Date"
            value={dateTo}
            onChange={onDateToChange}
            placeholder="YYYY-MM-DD"
            outputFormat="iso"
            leftIcon={true}
          />
        </div>
      </div>

      {hasActiveFilters && (
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
          <span className="text-slate-500 font-medium">Search filters applied</span>
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
