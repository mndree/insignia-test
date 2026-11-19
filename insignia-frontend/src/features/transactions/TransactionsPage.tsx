import React, { useState, useEffect } from 'react';
import { useSearchParams, useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/layout/Header';
import { TransactionFilters } from './TransactionFilters';
import { TransactionTable } from './TransactionTable';
import { Pagination } from '@/components/ui/Pagination';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { getTransactionsApi } from '@/services/api/endpoints';
import { useDebounce } from '@/hooks/useDebounce';
import { TransactionDirection } from '@/types';
import { APP_CONFIG } from '@/app/config';
import { normalizeApiError } from '@/services/api/client';
import { RefreshCw, FileText, AlertTriangle } from 'lucide-react';

export const TransactionsPage: React.FC = () => {
  const outletContext = useOutletContext<{ onOpenSidebar?: () => void }>() || {};
  const onOpenSidebar = outletContext.onOpenSidebar || (() => {});
  const [searchParams, setSearchParams] = useSearchParams();

  // Read URL query parameters
  const pageParam = parseInt(searchParams.get('page') || '1', 10);
  const pageSizeParam = parseInt(searchParams.get('pageSize') || '10', 10);
  const searchParam = searchParams.get('search') || '';
  const directionParam = (searchParams.get('direction') as TransactionDirection) || 'all';
  const dateFromParam = searchParams.get('dateFrom') || '';
  const dateToParam = searchParams.get('dateTo') || '';
  const sortByParam = searchParams.get('sortBy') || '';
  const sortOrderParam = (searchParams.get('sortOrder') as 'asc' | 'desc') || null;

  // Local state for debounced search input
  const [searchInput, setSearchInput] = useState(searchParam);
  const debouncedSearch = useDebounce(searchInput, 350);

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

  // Keep searchInput in sync if URL changes externally
  useEffect(() => {
    setSearchInput(searchParam);
  }, [searchParam]);

  const updateParam = (key: string, value: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value && value !== 'all') {
        next.set(key, value);
      } else {
        next.delete(key);
      }
      next.set('page', '1'); // Reset to page 1 on filter changes
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
          // Reset to default
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

  const isConfigured = APP_CONFIG.isDemoMode || APP_CONFIG.isTransactionsEndpointConfigured;

  // Query TanStack Query
  const {
    data,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: [
      'transactions',
      {
        page: pageParam,
        pageSize: pageSizeParam,
        search: searchParam,
        direction: directionParam,
        dateFrom: dateFromParam,
        dateTo: dateToParam,
        sortBy: sortByParam,
        sortOrder: sortOrderParam,
      },
    ],
    queryFn: () =>
      getTransactionsApi({
        page: pageParam,
        pageSize: pageSizeParam,
        search: searchParam || undefined,
        direction: directionParam !== 'all' ? directionParam : undefined,
        dateFrom: dateFromParam || undefined,
        dateTo: dateToParam || undefined,
        sortBy: sortByParam || undefined,
        sortOrder: sortOrderParam || undefined,
      }),
    enabled: isConfigured,
  });

  const hasActiveFilters = Boolean(
    searchParam || directionParam !== 'all' || dateFromParam || dateToParam
  );

  return (
    <div className="space-y-6">
      <Header
        onOpenSidebar={onOpenSidebar}
        title="Transactions History"
        description="Comprehensive paginated transaction ledger with search and filters"
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching || !isConfigured}
            aria-label="Refresh transactions"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        }
      />

      {!isConfigured ? (
        <div className="bg-white rounded-2xl border border-amber-200/90 p-8 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-navy-900">
                Paginated Transaction Endpoint Not Configured in Live Mode
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                The documented Stoplight specification does not supply a paginated transaction history endpoint
                (it only provides <code className="font-mono text-xs font-semibold">GET /top_transactions_per_user</code> which
                is strictly limited to a max-10 ranking).
              </p>
              <p className="text-sm text-slate-600 leading-relaxed">
                To test the complete search, filter, and pagination interface, please set{' '}
                <code className="font-mono font-semibold">VITE_DATA_MODE=demo</code> or configure an extended{' '}
                <code className="font-mono font-semibold">VITE_TRANSACTIONS_PATH=/transactions</code> backend route.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Filters Bar */}
          <TransactionFilters
            searchTerm={searchInput}
            direction={directionParam}
            dateFrom={dateFromParam}
            dateTo={dateToParam}
            onSearchChange={setSearchInput}
            onDirectionChange={(val) => updateParam('direction', val)}
            onDateFromChange={(val) => updateParam('dateFrom', val)}
            onDateToChange={(val) => updateParam('dateTo', val)}
            onClearFilters={handleClearFilters}
            hasActiveFilters={hasActiveFilters}
          />

          {/* Error & Retry Banner */}
          {error && (
            <Alert variant="error" title="Failed to Fetch Transactions">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <span>{normalizeApiError(error).message}</span>
                <Button variant="outline" size="sm" onClick={() => refetch()}>
                  Retry Request
                </Button>
              </div>
            </Alert>
          )}

          {/* Transactions Table */}
          <TransactionTable
            items={data?.items || []}
            totalCount={data?.total}
            isLoading={isLoading}
            currentSortField={sortByParam}
            currentSortOrder={sortOrderParam}
            onSort={handleSort}
          />

          {/* Pagination Controls */}
          {data && (
            <div className="bg-white rounded-xl border border-slate-200/80 px-4 shadow-xs">
              <Pagination
                currentPage={data.page}
                totalItems={data.total}
                pageSize={data.pageSize}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
              />
            </div>
          )}

          {/* Documentation Footer */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/60 text-xs text-slate-500 flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-400 shrink-0" />
            <span>
              Transactions displayed reflect authenticated user activity. Query filters are applied server-side before pagination.
            </span>
          </div>
        </>
      )}
    </div>
  );
};
