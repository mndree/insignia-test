import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useOutletContext } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { Card, CardContent } from '@/components/ui/Card';
import { TableColumnHeader, SortOrder } from '@/components/ui/TableColumnHeader';
import { getTopUsersApi } from '@/services/api/endpoints';
import { formatWalletUnits, getUserFullName } from '@/utils/formatters';
import { normalizeApiError } from '@/services/api/client';
import {
  Trophy,
  RefreshCw,
  Medal,
  Users,
  UserCheck,
} from 'lucide-react';

export const TopUsersPage: React.FC = () => {
  const outletContext = useOutletContext<{ onOpenSidebar?: () => void }>() || {};
  const onOpenSidebar = outletContext.onOpenSidebar || (() => {});
  const { user: currentUser } = useAuth();

  const [sortField, setSortField] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>(null);

  const {
    data,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: ['top_users'],
    queryFn: getTopUsersApi,
  });

  const users = data || [];

  const handleSort = (field: string) => {
    if (sortField === field) {
      if (sortOrder === 'asc') {
        setSortOrder('desc');
      } else if (sortOrder === 'desc') {
        // Reset to default
        setSortField(null);
        setSortOrder(null);
      } else {
        setSortOrder('asc');
      }
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const indexedUsers = useMemo(() => {
    return users.map((u, index) => ({
      ...u,
      originalRank: index + 1,
    }));
  }, [users]);

  const sortedUsers = useMemo(() => {
    if (!sortField) return indexedUsers;
    const list = [...indexedUsers];
    const isAsc = sortOrder === 'asc';

    list.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'rank') {
        cmp = a.originalRank - b.originalRank;
      } else if (sortField === 'username' || sortField === 'fullName' || sortField === 'name') {
        const nameA = getUserFullName(a.username, a.fullName);
        const nameB = getUserFullName(b.username, b.fullName);
        cmp = nameA.localeCompare(nameB);
      } else if (sortField === 'transacted_value' || sortField === 'amount') {
        cmp = a.transacted_value - b.transacted_value;
      }
      return isAsc ? cmp : -cmp;
    });

    return list;
  }, [indexedUsers, sortField, sortOrder]);

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-100 text-amber-700 font-bold text-xs ring-2 ring-amber-300">
          <Medal className="w-4 h-4 text-amber-600" />
        </span>
      );
    }
    if (rank === 2) {
      return (
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-200 text-slate-700 font-bold text-xs ring-2 ring-slate-300">
          2
        </span>
      );
    }
    if (rank === 3) {
      return (
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-700/10 text-amber-800 font-bold text-xs ring-2 ring-amber-600/30">
          3
        </span>
      );
    }
    return (
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full text-slate-400 font-semibold text-xs">
        #{rank}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <Header
        onOpenSidebar={onOpenSidebar}
        title="Top Transacting Users"
        description="Platform leaderboard ranked by total aggregated outgoing transfer volume"
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            aria-label="Refresh top users"
            className="bg-white hover:bg-slate-50 border-slate-200/90 text-navy-800 font-semibold"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isFetching ? 'animate-spin text-brand-600' : ''}`} />
            Refresh
          </Button>
        }
      />

      {error && (
        <Alert variant="error" title="Failed to Fetch Leaderboard">
          <div className="flex items-center justify-between gap-3">
            <span>{normalizeApiError(error).message}</span>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        </Alert>
      )}

      {isLoading ? (
        <div className="bg-white rounded-xl border border-slate-200/80 p-10 flex flex-col items-center justify-center">
          <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm text-slate-500 font-medium">Computing leaderboard rankings...</p>
        </div>
      ) : users.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent className="space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
              <Users className="w-6 h-6" />
            </div>
            <h4 className="text-base font-semibold text-navy-900">No Outgoing Transfers Recorded</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No users have completed outgoing transfers yet. Users will appear here once they send wallet units.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
          {/* Table Count Header */}
          <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
              <span className="font-medium">
                Showing <strong className="text-navy-900 font-bold">{sortedUsers.length}</strong> top transacting users
              </span>
            </div>
            {sortField && (
              <span className="inline-flex items-center gap-1 text-[11px] text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full font-medium border border-brand-200/60">
                Sorted by <span className="font-semibold">{sortField}</span> ({sortOrder === 'asc' ? 'ascending' : 'descending'})
              </span>
            )}
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <TableColumnHeader
                    label="Rank"
                    field="rank"
                    currentSortField={sortField}
                    currentSortOrder={sortOrder}
                    onSort={handleSort}
                    className="w-20"
                  />
                  <TableColumnHeader
                    label="Full Name"
                    field="fullName"
                    currentSortField={sortField}
                    currentSortOrder={sortOrder}
                    onSort={handleSort}
                  />
                  <TableColumnHeader
                    label="Total Sent (Outgoing)"
                    field="transacted_value"
                    currentSortField={sortField}
                    currentSortOrder={sortOrder}
                    onSort={handleSort}
                    align="right"
                  />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {sortedUsers.map((item) => {
                  const rank = item.originalRank;
                  const isCurrent =
                    currentUser?.username?.toLowerCase() === item.username.toLowerCase();

                  return (
                    <tr
                      key={`${item.username}-${rank}`}
                      className={`transition-colors ${
                        isCurrent
                          ? 'bg-brand-50/60 font-semibold border-l-4 border-l-brand-600'
                          : 'hover:bg-slate-50/70'
                      }`}
                    >
                      <td className="py-3.5 px-4 sm:px-6 whitespace-nowrap">
                        {getRankBadge(rank)}
                      </td>
                      <td className="py-3.5 px-4 sm:px-6 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="flex flex-col">
                            <span className="font-semibold text-navy-900">
                              {getUserFullName(item.username, item.fullName)}
                            </span>
                            <span className="text-xs text-slate-400 font-mono">
                              @{item.username}
                            </span>
                          </div>
                          {isCurrent && (
                            <Badge variant="default" size="sm">
                              <UserCheck className="w-3 h-3 text-brand-600" />
                              You
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 sm:px-6 text-right whitespace-nowrap font-mono font-bold text-navy-900">
                        {formatWalletUnits(item.transacted_value, { absolute: true })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="py-3 px-6 bg-slate-50/60 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
              Top {sortedUsers.length} transacting users
            </span>
            <span className="text-slate-400">Strictly outgoing transfers</span>
          </div>
        </div>
      )}
    </div>
  );
};
