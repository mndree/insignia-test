import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useOutletContext } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { Card, CardContent } from '@/components/ui/Card';
import { TableColumnHeader, SortOrder } from '@/components/ui/TableColumnHeader';
import { getTopTransactionsPerUserApi } from '@/services/api/endpoints';
import { formatWalletUnits } from '@/utils/formatters';
import { normalizeApiError } from '@/services/api/client';
import {
  TrendingUp,
  RefreshCw,
  ArrowDownLeft,
  ArrowUpRight,
  Info,
  Layers,
} from 'lucide-react';

export const TopTransactionsPage: React.FC = () => {
  const outletContext = useOutletContext<{ onOpenSidebar?: () => void }>() || {};
  const onOpenSidebar = outletContext.onOpenSidebar || (() => {});

  const [sortField, setSortField] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>(null);

  const {
    data,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: ['top_transactions'],
    queryFn: getTopTransactionsPerUserApi,
  });

  const transactions = data || [];

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

  const indexedTransactions = useMemo(() => {
    return transactions.map((item, index) => ({
      ...item,
      originalRank: index + 1,
    }));
  }, [transactions]);

  const sortedTransactions = useMemo(() => {
    if (!sortField) return indexedTransactions;
    const list = [...indexedTransactions];
    const isAsc = sortOrder === 'asc';

    list.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'rank') {
        cmp = a.originalRank - b.originalRank;
      } else if (sortField === 'username') {
        cmp = a.username.localeCompare(b.username);
      } else if (sortField === 'direction') {
        const dirA = a.amount > 0 ? 'incoming' : 'outgoing';
        const dirB = b.amount > 0 ? 'incoming' : 'outgoing';
        cmp = dirA.localeCompare(dirB);
      } else if (sortField === 'amount') {
        cmp = a.amount - b.amount;
      }
      return isAsc ? cmp : -cmp;
    });

    return list;
  }, [indexedTransactions, sortField, sortOrder]);

  return (
    <div className="space-y-6">
      <Header
        onOpenSidebar={onOpenSidebar}
        title="Top Transactions"
        description="Highest value transfers for the authenticated user (ranked by absolute amount)"
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            aria-label="Refresh top transactions"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        }
      />

      {/* Specification Context Banner */}
      <div className="p-4 rounded-xl bg-indigo-50/80 border border-indigo-100 flex items-start gap-3 text-xs text-navy-800">
        <Info className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-brand-700">Documented Contract Rules</span>
            <Badge variant="default" size="sm">Top 10 Fixed</Badge>
          </div>
          <p className="text-slate-600 leading-relaxed">
            Per the Stoplight specification for <code className="font-mono font-bold text-navy-900">GET /top_transactions_per_user</code>:
            Transfers are sorted by absolute amount descending. Outgoing transfers have negative amounts, while incoming transfers have positive amounts.
            This endpoint returns up to 10 records and does not provide timestamps or unique IDs.
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="error" title="Failed to Fetch Top Transactions">
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
          <p className="text-sm text-slate-500 font-medium">Fetching top transfers...</p>
        </div>
      ) : transactions.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent className="space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
              <Layers className="w-6 h-6" />
            </div>
            <h4 className="text-base font-semibold text-navy-900">No Transactions Recorded</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              You have not executed or received any transfers yet. Perform a transfer from the Overview page to generate transaction data.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
          {/* Table Count Header */}
          <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5 text-brand-600" />
              <span className="font-medium">
                Showing <strong className="text-navy-900 font-bold">{sortedTransactions.length}</strong> top transactions
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
                    label="Counterparty"
                    field="username"
                    currentSortField={sortField}
                    currentSortOrder={sortOrder}
                    onSort={handleSort}
                  />
                  <TableColumnHeader
                    label="Direction"
                    field="direction"
                    currentSortField={sortField}
                    currentSortOrder={sortOrder}
                    onSort={handleSort}
                  />
                  <TableColumnHeader
                    label="Signed Amount"
                    field="amount"
                    currentSortField={sortField}
                    currentSortOrder={sortOrder}
                    onSort={handleSort}
                    align="right"
                  />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {sortedTransactions.map((item) => {
                  const isIncoming = item.amount > 0;
                  return (
                    <tr key={`${item.username}-${item.originalRank}`} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 sm:px-6 font-semibold text-xs text-slate-400">
                        #{item.originalRank}
                      </td>
                      <td className="py-3.5 px-4 sm:px-6 whitespace-nowrap">
                        <span className="font-semibold text-navy-900 font-mono">
                          @{item.username}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 sm:px-6 whitespace-nowrap">
                        {isIncoming ? (
                          <Badge variant="success">
                            <ArrowDownLeft className="w-3 h-3 text-emerald-600" />
                            Incoming
                          </Badge>
                        ) : (
                          <Badge variant="danger">
                            <ArrowUpRight className="w-3 h-3 text-rose-600" />
                            Outgoing
                          </Badge>
                        )}
                      </td>
                      <td
                        className={`py-3.5 px-4 sm:px-6 text-right whitespace-nowrap font-mono font-semibold ${
                          isIncoming ? 'text-incoming font-bold' : 'text-outgoing'
                        }`}
                      >
                        {formatWalletUnits(item.amount, { includeSign: true })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="py-3 px-6 bg-slate-50/60 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-brand-600" />
              Showing {sortedTransactions.length} of max 10 transactions
            </span>
            <span className="text-slate-400">Ranked by absolute transfer volume</span>
          </div>
        </div>
      )}
    </div>
  );
};
