import React, { useState, useEffect } from 'react';
import { useSearchParams, useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/layout/Header';
import { TopupFilters } from './TopupFilters';
import { TopupTable } from './TopupTable';
import { TopupDetailsModal } from './TopupDetailsModal';
import { TopupModal } from '@/features/overview/TopupModal';
import { Pagination } from '@/components/ui/Pagination';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { getTopupsApi } from '@/services/api/endpoints';
import { useDebounce } from '@/hooks/useDebounce';
import { TopupRecordDto } from '@/types';
import { formatNumber } from '@/utils/formatters';
import { normalizeApiError } from '@/services/api/client';
import {
  ArrowDownCircle,
  RefreshCw,
  TrendingUp,
  Receipt,
  PlusCircle,
} from 'lucide-react';

export const TopupsPage: React.FC = () => {
  const outletContext = useOutletContext<{ onOpenSidebar?: () => void }>() || {};
  const onOpenSidebar = outletContext.onOpenSidebar || (() => {});
  const [searchParams, setSearchParams] = useSearchParams();

  // Read URL query parameters
  const pageParam = parseInt(searchParams.get('page') || '1', 10);
  const pageSizeParam = parseInt(searchParams.get('pageSize') || '10', 10);
  const searchParam = searchParams.get('search') || '';
  const dateFromParam = searchParams.get('dateFrom') || '';
  const dateToParam = searchParams.get('dateTo') || '';
  const sortByParam = searchParams.get('sortBy') || '';
  const sortOrderParam = (searchParams.get('sortOrder') as 'asc' | 'desc') || null;

  // Local state for debounced search input
  const [searchInput, setSearchInput] = useState(searchParam);
  const debouncedSearch = useDebounce(searchInput, 350);

  // Modal states
  const [selectedTopup, setSelectedTopup] = useState<TopupRecordDto | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isNewTopupModalOpen, setIsNewTopupModalOpen] = useState(false);

  // Sync debounced search to URL query param and reset page to 1
  useEffect(() => {
    if (debouncedSearch !== searchParam) {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (debouncedSearch) {
          next.set('search', debouncedSearch);
        } else {
          next.delete('search');
        }
        next.set('page', '1');
        return next;
      });
    }
  }, [debouncedSearch, searchParam, setSearchParams]);

  useEffect(() => {
    setSearchInput(searchParam);
  }, [searchParam]);

  const handleDateFromChange = (date: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (date) {
        next.set('dateFrom', date);
      } else {
        next.delete('dateFrom');
      }
      next.set('page', '1');
      return next;
    });
  };

  const handleDateToChange = (date: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (date) {
        next.set('dateTo', date);
      } else {
        next.delete('dateTo');
      }
      next.set('page', '1');
      return next;
    });
  };

  const handlePageChange = (newPage: number) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('page', newPage.toString());
      return next;
    });
  };

  const handlePageSizeChange = (newSize: number) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('pageSize', newSize.toString());
      next.set('page', '1');
      return next;
    });
  };

  const handleSort = (field: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (sortByParam === field) {
        if (sortOrderParam === 'asc') {
          next.set('sortOrder', 'desc');
        } else if (sortOrderParam === 'desc') {
          next.delete('sortBy');
          next.delete('sortOrder');
        } else {
          next.set('sortOrder', 'asc');
        }
      } else {
        next.set('sortBy', field);
        next.set('sortOrder', 'asc');
      }
      next.set('page', '1');
      return next;
    });
  };

  const handleClearFilters = () => {
    setSearchInput('');
    setSearchParams({
      page: '1',
      pageSize: pageSizeParam.toString(),
    });
  };

  // Fetch top-ups list
  const {
    data,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: [
      'topups',
      {
        page: pageParam,
        pageSize: pageSizeParam,
        search: searchParam,
        dateFrom: dateFromParam,
        dateTo: dateToParam,
        sortBy: sortByParam,
        sortOrder: sortOrderParam,
      },
    ],
    queryFn: () =>
      getTopupsApi({
        page: pageParam,
        pageSize: pageSizeParam,
        search: searchParam || undefined,
        dateFrom: dateFromParam || undefined,
        dateTo: dateToParam || undefined,
        sortBy: sortByParam || undefined,
        sortOrder: sortOrderParam || undefined,
      }),
    staleTime: 1000 * 30,
  });

  const items = data?.items || [];
  const total = data?.total || 0;
  const stats = data?.stats || {
    totalTopups: total,
    totalAmount: items.reduce((acc, curr) => acc + curr.amount, 0),
    averageAmount:
      items.length > 0
        ? Math.round((items.reduce((acc, curr) => acc + curr.amount, 0) / items.length) * 100) /
          100
        : 0,
  };

  const hasActiveFilters = Boolean(searchParam || dateFromParam || dateToParam);

  const handleViewDetail = (item: TopupRecordDto) => {
    setSelectedTopup(item);
    setIsDetailModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header */}
      <Header
        title="Top Ups"
        description="Comprehensive ledger and audit trail of user balance top-up deposits"
        onOpenSidebar={onOpenSidebar}
        actions={
          <div className="flex items-center gap-2.5">
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsNewTopupModalOpen(true)}
              className="gap-2 shadow-xs font-semibold"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Top Up Balance</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              className="gap-2 bg-white"
              title="Refresh ledger"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin text-brand-600' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>
        }
      />

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Topup Volume */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <ArrowDownCircle className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-0.5">
              Total Top-up Volume
            </span>
            <div className="flex items-baseline gap-1.5 truncate">
              <span className="text-2xl font-extrabold text-navy-900 font-mono tracking-tight">
                {formatNumber(stats.totalAmount)}
              </span>
              <span className="text-xs font-medium text-slate-500">units</span>
            </div>
          </div>
        </div>

        {/* Total Topup Count */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-brand-600 shrink-0">
            <Receipt className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-0.5">
              Total Deposits Count
            </span>
            <div className="flex items-baseline gap-1.5 truncate">
              <span className="text-2xl font-extrabold text-navy-900 font-mono tracking-tight">
                {formatNumber(stats.totalTopups)}
              </span>
              <span className="text-xs font-medium text-slate-500">records</span>
            </div>
          </div>
        </div>

        {/* Average Topup Amount */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-0.5">
              Average Deposit
            </span>
            <div className="flex items-baseline gap-1.5 truncate">
              <span className="text-2xl font-extrabold text-navy-900 font-mono tracking-tight">
                {formatNumber(stats.averageAmount)}
              </span>
              <span className="text-xs font-medium text-slate-500">units/txn</span>
            </div>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert
          variant="error"
          title="Failed to Load Top-ups"
        >
          {normalizeApiError(error).message}
        </Alert>
      )}

      {/* Filter Bar */}
      <TopupFilters
        searchTerm={searchInput}
        dateFrom={dateFromParam}
        dateTo={dateToParam}
        onSearchChange={setSearchInput}
        onDateFromChange={handleDateFromChange}
        onDateToChange={handleDateToChange}
        onClearFilters={handleClearFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Topups Grid List Table */}
      <TopupTable
        items={items}
        isLoading={isLoading}
        totalCount={total}
        currentSortField={sortByParam}
        currentSortOrder={sortOrderParam}
        onSort={handleSort}
        onViewDetail={handleViewDetail}
      />

      {/* Pagination Controls */}
      {data && total > 0 && (
        <div className="bg-white rounded-xl border border-slate-200/80 px-4 shadow-xs">
          <Pagination
            currentPage={data.page}
            totalItems={data.total}
            pageSize={data.pageSize}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            pageSizeOptions={[5, 10, 20, 50]}
          />
        </div>
      )}

      {/* Top-up Details Modal */}
      <TopupDetailsModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedTopup(null);
        }}
        topup={selectedTopup}
      />

      {/* Create New Top-up Modal */}
      <TopupModal
        isOpen={isNewTopupModalOpen}
        onClose={() => {
          setIsNewTopupModalOpen(false);
          refetch();
        }}
      />
    </div>
  );
};
