import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getUsersListApi } from '@/services/api/endpoints';
import { useDebounce } from '@/hooks/useDebounce';
import { UserAvatar } from './UserAvatar';
import { StatusBadge } from './StatusBadge';
import { DemoBadge } from '@/components/ui/DemoBadge';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { formatNumber, formatDateTime } from '@/utils/formatters';
import { normalizeApiError } from '@/services/api/client';
import {
  Users,
  UserCheck,
  Wallet,
  Search,
  RefreshCw,
  Clock,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';

export const UsersListPage: React.FC = () => {
  const outletContext = useOutletContext<{ onOpenSidebar?: () => void }>() || {};
  const onOpenSidebar = outletContext.onOpenSidebar || (() => {});
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Read URL query parameters
  const pageParam = parseInt(searchParams.get('page') || '1', 10);
  const pageSizeParam = parseInt(searchParams.get('pageSize') || '6', 10);
  const searchParam = searchParams.get('search') || '';
  const statusParam = searchParams.get('status') || 'All statuses';

  const [searchInput, setSearchInput] = useState(searchParam);
  const debouncedSearch = useDebounce(searchInput, 300);

  // Sync debounced search to URL
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

  const updateStatus = (newStatus: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (newStatus && newStatus !== 'All statuses') {
        next.set('status', newStatus);
      } else {
        next.delete('status');
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

  // Fetch users list and stats
  const {
    data,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: [
      'admin_users',
      {
        page: pageParam,
        pageSize: pageSizeParam,
        search: searchParam,
        status: statusParam,
      },
    ],
    queryFn: () =>
      getUsersListApi({
        page: pageParam,
        pageSize: pageSizeParam,
        search: searchParam || undefined,
        status: statusParam !== 'All statuses' ? statusParam : undefined,
      }),
  });

  const total = data?.total ?? 0;
  const items = data?.items ?? [];
  const stats = data?.stats ?? {
    totalUsers: 128,
    activeUsers: 116,
    totalWalletBalance: 845250,
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSizeParam));
  const startItem = total === 0 ? 0 : (pageParam - 1) * pageSizeParam + 1;
  const endItem = Math.min(pageParam * pageSizeParam, total);

  // Helper to render pagination page numbers
  const renderPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (pageParam > 3) pages.push('...');
      const start = Math.max(2, pageParam - 1);
      const end = Math.min(totalPages - 1, pageParam + 1);
      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) pages.push(i);
      }
      if (pageParam < totalPages - 2) pages.push('...');
      if (!pages.includes(totalPages)) pages.push(totalPages);
    }

    return pages.map((p, idx) => {
      if (p === '...') {
        return (
          <span key={`ellipsis-${idx}`} className="px-2 py-1 text-slate-400 text-xs">
            ...
          </span>
        );
      }
      const isCurrent = p === pageParam;
      return (
        <button
          key={p}
          onClick={() => handlePageChange(Number(p))}
          className={`w-7 h-7 rounded-lg text-xs font-semibold transition-colors focus-ring ${
            isCurrent
              ? 'bg-brand-600 text-white shadow-xs'
              : 'text-navy-700 hover:bg-slate-100'
          }`}
        >
          {p}
        </button>
      );
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenSidebar}
              className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-navy-900 hover:bg-slate-200/70 focus-ring"
              aria-label="Open sidebar"
            >
              <Users className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold tracking-tight text-navy-900">
              Users
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage user profiles and wallet balances.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <DemoBadge />
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="bg-white hover:bg-slate-50 border-slate-200/90 text-navy-800 font-semibold"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isFetching ? 'animate-spin text-brand-600' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="error" title="Failed to Load Users">
          {normalizeApiError(error).message}
        </Alert>
      )}

      {/* Top Stat Cards (3 Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Total Users */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-brand-600 shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Users
            </span>
            <span className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight font-mono">
              {formatNumber(stats.totalUsers)}
            </span>
          </div>
        </div>

        {/* Active Users */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
              Active Users
            </span>
            <span className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight font-mono">
              {formatNumber(stats.activeUsers)}
            </span>
          </div>
        </div>

        {/* Total Wallet Balance */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-brand-600 shrink-0">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Wallet Balance
            </span>
            <span className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight font-mono">
              {formatNumber(stats.totalWalletBalance)}{' '}
              <span className="text-sm font-semibold text-slate-500 font-sans">units</span>
            </span>
          </div>
        </div>
      </div>

      {/* Search & Filter Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Search Field */}
          <div className="sm:col-span-2">
            <label
              htmlFor="searchUserInput"
              className="block text-xs font-semibold uppercase tracking-wider text-navy-700 mb-1.5"
            >
              Search User
            </label>
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
              <input
                id="searchUserInput"
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search name, username or email"
                className="w-full bg-white text-navy-900 border border-slate-300 rounded-xl pl-10 pr-4 py-2 text-sm hover:border-slate-400 transition-colors focus-ring placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Status Dropdown */}
          <div>
            <label
              htmlFor="statusSelect"
              className="block text-xs font-semibold uppercase tracking-wider text-navy-700 mb-1.5"
            >
              Status
            </label>
            <div className="relative flex items-center">
              <select
                id="statusSelect"
                value={statusParam}
                onChange={(e) => updateStatus(e.target.value)}
                className="w-full bg-white text-navy-900 border border-slate-300 rounded-xl px-3.5 py-2 text-sm hover:border-slate-400 transition-colors focus-ring cursor-pointer appearance-none pr-10"
              >
                <option value="All statuses">All statuses</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex flex-col items-center justify-center">
            <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-sm text-slate-500 font-medium">Loading user profiles...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Users className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            <h4 className="font-semibold text-navy-900">No users match your filters</h4>
            <p className="text-xs text-slate-400 mt-1">Try clearing your search query or status filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th scope="col" className="py-3.5 px-4 sm:px-6">User</th>
                  <th scope="col" className="py-3.5 px-4 sm:px-6">Email</th>
                  <th scope="col" className="py-3.5 px-4 sm:px-6">Wallet Balance</th>
                  <th scope="col" className="py-3.5 px-4 sm:px-6">Status</th>
                  <th scope="col" className="py-3.5 px-4 sm:px-6">Joined Date</th>
                  <th scope="col" className="py-3.5 px-4 sm:px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {items.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-slate-50/60 transition-colors"
                  >
                    {/* User: Avatar + Name + @username */}
                    <td className="py-4 px-4 sm:px-6 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <UserAvatar name={user.fullName || user.username} size="md" />
                        <div>
                          <span className="block font-bold text-navy-900 leading-snug">
                            {user.fullName}
                          </span>
                          <span className="block text-xs font-mono text-slate-400">
                            @{user.username}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="py-4 px-4 sm:px-6 whitespace-nowrap text-xs text-slate-600">
                      {user.email}
                    </td>

                    {/* Wallet Balance */}
                    <td className="py-4 px-4 sm:px-6 whitespace-nowrap font-mono font-bold text-navy-900">
                      {formatNumber(user.balance)} <span className="font-sans font-normal text-xs text-slate-500">units</span>
                    </td>

                    {/* Status */}
                    <td className="py-4 px-4 sm:px-6 whitespace-nowrap">
                      <StatusBadge status={user.status} />
                    </td>

                    {/* Joined Date */}
                    <td className="py-4 px-4 sm:px-6 whitespace-nowrap text-xs text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{formatDateTime(user.createdAt)}</span>
                      </div>
                    </td>

                    {/* Action */}
                    <td className="py-4 px-4 sm:px-6 whitespace-nowrap text-right">
                      <button
                        onClick={() => navigate(`/users/${user.username}`)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-brand-200/80 text-brand-600 hover:bg-brand-50 hover:border-brand-300 transition-colors focus-ring"
                      >
                        View Details
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer / Pagination */}
        <div className="p-4 bg-slate-50/60 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Showing <span className="font-semibold text-navy-900">{startItem}–{endItem}</span> of{' '}
            <span className="font-semibold text-navy-900">{total}</span> users
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handlePageChange(pageParam - 1)}
              disabled={pageParam <= 1}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed focus-ring"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            {renderPageNumbers()}

            <button
              onClick={() => handlePageChange(pageParam + 1)}
              disabled={pageParam >= totalPages}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed focus-ring"
              aria-label="Next page"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
