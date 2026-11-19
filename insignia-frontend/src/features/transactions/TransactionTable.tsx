import React from 'react';
import { TransactionRecordDto } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { TableColumnHeader, SortOrder } from '@/components/ui/TableColumnHeader';
import { formatDateTime, formatWalletUnits } from '@/utils/formatters';
import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight, Clock, Layers } from 'lucide-react';

interface TransactionTableProps {
  items: TransactionRecordDto[];
  isLoading: boolean;
  totalCount?: number;
  currentSortField?: string | null;
  currentSortOrder?: SortOrder;
  onSort?: (field: string) => void;
}

export const TransactionTable: React.FC<TransactionTableProps> = ({
  items,
  isLoading,
  totalCount,
  currentSortField,
  currentSortOrder,
  onSort = () => {},
}) => {
  // Client-side sort fallback for instant responsiveness
  const sortedItems = React.useMemo(() => {
    if (!currentSortField) return items;
    const list = [...items];
    const isAsc = currentSortOrder === 'asc';

    list.sort((a, b) => {
      let cmp = 0;
      if (currentSortField === 'id') {
        cmp = a.id.localeCompare(b.id);
      } else if (currentSortField === 'username' || currentSortField === 'counterparty') {
        cmp = a.username.localeCompare(b.username);
      } else if (currentSortField === 'direction') {
        const dirA = a.amount > 0 ? 'incoming' : 'outgoing';
        const dirB = b.amount > 0 ? 'incoming' : 'outgoing';
        cmp = dirA.localeCompare(dirB);
      } else if (currentSortField === 'amount') {
        cmp = a.amount - b.amount;
      } else if (currentSortField === 'created_at' || currentSortField === 'date') {
        cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      return isAsc ? cmp : -cmp;
    });

    return list;
  }, [items, currentSortField, currentSortOrder]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200/80 p-8 flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm text-slate-500 font-medium">Loading transactions...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200/80 p-12 text-center">
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-3">
          <ArrowLeftRight className="w-6 h-6" />
        </div>
        <h4 className="text-base font-semibold text-navy-900 mb-1">No Transactions Found</h4>
        <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
          No records match the current filter criteria. Try clearing search filters or submitting a new transfer or top-up.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
      {/* Table Data Count Summary Header */}
      <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-brand-600" />
          <span className="font-medium">
            Showing <strong className="text-navy-900 font-bold">{sortedItems.length}</strong> {totalCount ? `of ${totalCount} transactions on this page` : 'transactions in table'}
          </span>
        </div>
        {currentSortField && (
          <span className="inline-flex items-center gap-1 text-[11px] text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full font-medium border border-brand-200/60">
            Sorted by <span className="font-semibold">{currentSortField}</span> ({currentSortOrder === 'asc' ? 'ascending' : 'descending'})
          </span>
        )}
      </div>

      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              <TableColumnHeader
                label="Transaction ID"
                field="id"
                currentSortField={currentSortField}
                currentSortOrder={currentSortOrder}
                onSort={onSort}
              />
              <TableColumnHeader
                label="Counterparty"
                field="username"
                currentSortField={currentSortField}
                currentSortOrder={currentSortOrder}
                onSort={onSort}
              />
              <TableColumnHeader
                label="Direction"
                field="direction"
                currentSortField={currentSortField}
                currentSortOrder={currentSortOrder}
                onSort={onSort}
              />
              <TableColumnHeader
                label="Amount"
                field="amount"
                currentSortField={currentSortField}
                currentSortOrder={currentSortOrder}
                onSort={onSort}
                align="right"
              />
              <TableColumnHeader
                label="Date & Time"
                field="created_at"
                currentSortField={currentSortField}
                currentSortOrder={currentSortOrder}
                onSort={onSort}
                align="right"
              />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {sortedItems.map((txn) => {
              const isIncoming = txn.amount > 0;
              return (
                <tr
                  key={txn.id}
                  className="hover:bg-slate-50/70 transition-colors"
                >
                  {/* Transaction ID */}
                  <td className="py-3.5 px-4 sm:px-6 font-mono text-xs font-semibold text-navy-900 whitespace-nowrap">
                    {txn.id}
                  </td>

                  {/* Counterparty */}
                  <td className="py-3.5 px-4 sm:px-6 whitespace-nowrap">
                    <span className="font-medium text-navy-800">
                      @{txn.username}
                    </span>
                    {txn.description && (
                      <span className="block text-[11px] text-slate-400 font-normal truncate max-w-xs">
                        {txn.description}
                      </span>
                    )}
                  </td>

                  {/* Direction Badge */}
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

                  {/* Amount */}
                  <td
                    className={`py-3.5 px-4 sm:px-6 text-right whitespace-nowrap font-mono font-semibold ${
                      isIncoming ? 'text-incoming font-bold' : 'text-outgoing'
                    }`}
                  >
                    {formatWalletUnits(txn.amount, { includeSign: true })}
                  </td>

                  {/* Date & Time */}
                  <td className="py-3.5 px-4 sm:px-6 text-right text-xs text-slate-500 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5 justify-end">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {formatDateTime(txn.created_at)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
