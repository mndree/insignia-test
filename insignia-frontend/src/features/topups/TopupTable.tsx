import React from 'react';
import { TopupRecordDto } from '@/types';
import { TableColumnHeader, SortOrder } from '@/components/ui/TableColumnHeader';
import { UserAvatar } from '@/features/users/UserAvatar';
import { formatNumber, formatDateTime } from '@/utils/formatters';
import {
  ArrowDownCircle,
  Clock,
  Layers,
  FileCheck2,
  FileX,
  ShieldCheck,
  Eye,
} from 'lucide-react';

interface TopupTableProps {
  items: TopupRecordDto[];
  isLoading: boolean;
  totalCount?: number;
  currentSortField?: string | null;
  currentSortOrder?: SortOrder;
  onSort?: (field: string) => void;
  onViewDetail: (item: TopupRecordDto) => void;
}

export const TopupTable: React.FC<TopupTableProps> = ({
  items,
  isLoading,
  totalCount,
  currentSortField,
  currentSortOrder,
  onSort = () => {},
  onViewDetail,
}) => {
  // Client-side sort fallback
  const sortedItems = React.useMemo(() => {
    if (!currentSortField || !currentSortOrder) return items;
    const list = [...items];
    const isAsc = currentSortOrder === 'asc';

    list.sort((a, b) => {
      let cmp = 0;
      if (currentSortField === 'id' || currentSortField === 'topupCode') {
        cmp = (a.topupCode || a.id).localeCompare(b.topupCode || b.id);
      } else if (currentSortField === 'user' || currentSortField === 'username') {
        cmp = (a.user?.username || '').localeCompare(b.user?.username || '');
      } else if (currentSortField === 'amount') {
        cmp = a.amount - b.amount;
      } else if (currentSortField === 'created_at' || currentSortField === 'date') {
        cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (currentSortField === 'createdBy') {
        cmp = (a.createdBy || '').localeCompare(b.createdBy || '');
      }
      return isAsc ? cmp : -cmp;
    });

    return list;
  }, [items, currentSortField, currentSortOrder]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200/80 p-12 flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm text-slate-500 font-medium">Loading top-up records...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200/80 p-12 text-center">
        <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 mx-auto mb-3">
          <ArrowDownCircle className="w-6 h-6" />
        </div>
        <h4 className="text-base font-semibold text-navy-900 mb-1">No Top-ups Found</h4>
        <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
          No top-up records match the selected filter criteria. Try resetting search filters or issuing a new balance top-up.
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
            Showing <strong className="text-navy-900 font-bold">{sortedItems.length}</strong>{' '}
            {totalCount ? `of ${totalCount} top-ups on this page` : 'top-ups in table'}
          </span>
        </div>
        {currentSortField && (
          <span className="inline-flex items-center gap-1 text-[11px] text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full font-medium border border-brand-200/60">
            Sorted by <span className="font-semibold">{currentSortField}</span> (
            {currentSortOrder === 'asc' ? 'ascending' : 'descending'})
          </span>
        )}
      </div>

      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              <TableColumnHeader
                label="Topup ID"
                field="id"
                currentSortField={currentSortField}
                currentSortOrder={currentSortOrder}
                onSort={onSort}
              />
              <TableColumnHeader
                label="Recipient User"
                field="user"
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
              />
              <TableColumnHeader
                label="Created By"
                field="createdBy"
                currentSortField={currentSortField}
                currentSortOrder={currentSortOrder}
                onSort={onSort}
              />
              <th
                scope="col"
                className="py-3.5 px-4 sm:px-6 select-none font-semibold text-[11px] uppercase tracking-wider text-slate-500"
              >
                Receipt
              </th>
              <TableColumnHeader
                label="Date & Time"
                field="date"
                currentSortField={currentSortField}
                currentSortOrder={currentSortOrder}
                onSort={onSort}
              />
              <th
                scope="col"
                className="py-3.5 px-4 sm:px-6 text-right select-none font-semibold text-[11px] uppercase tracking-wider text-slate-500"
              >
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {sortedItems.map((topup) => {
              const code = topup.topupCode || topup.id;
              const hasReceipt = Boolean(topup.attachment);

              return (
                <tr
                  key={topup.id}
                  className="hover:bg-slate-50/70 transition-colors group"
                >
                  {/* Topup ID */}
                  <td className="py-4 px-4 sm:px-6 whitespace-nowrap">
                    <span className="font-mono font-bold text-xs sm:text-sm text-navy-900 group-hover:text-brand-600 transition-colors">
                      {code}
                    </span>
                    {topup.notes && (
                      <span className="block text-[11px] text-slate-400 truncate max-w-[180px] mt-0.5">
                        {topup.notes}
                      </span>
                    )}
                  </td>

                  {/* Recipient User */}
                  <td className="py-4 px-4 sm:px-6 whitespace-nowrap">
                    <div className="flex items-center gap-2.5">
                      <UserAvatar
                        name={topup.user?.fullName || topup.user?.username || 'User'}
                        size="sm"
                        avatarUrl={topup.user?.avatarUrl}
                      />
                      <div>
                        <span className="block font-semibold text-navy-900 text-xs sm:text-sm leading-tight">
                          {topup.user?.fullName || topup.user?.username}
                        </span>
                        <span className="block text-[11px] font-mono text-slate-400">
                          @{topup.user?.username}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Amount (Green +Units) */}
                  <td className="py-4 px-4 sm:px-6 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 font-mono font-bold text-sm text-emerald-600">
                      <span>+{formatNumber(topup.amount)}</span>
                      <span className="font-sans font-normal text-[11px] text-slate-400">
                        units
                      </span>
                    </div>
                  </td>

                  {/* Created By */}
                  <td className="py-4 px-4 sm:px-6 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-navy-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                      <ShieldCheck className="w-3 h-3 text-brand-600" />
                      @{topup.createdBy || 'admin'}
                    </span>
                  </td>

                  {/* Attachment / Receipt indicator */}
                  <td className="py-4 px-4 sm:px-6 whitespace-nowrap">
                    {hasReceipt ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/80">
                        <FileCheck2 className="w-3 h-3 text-emerald-600" />
                        Attached
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md">
                        <FileX className="w-3 h-3 text-slate-300" />
                        None
                      </span>
                    )}
                  </td>

                  {/* Date & Time */}
                  <td className="py-4 px-4 sm:px-6 whitespace-nowrap text-xs text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{formatDateTime(topup.createdAt)}</span>
                    </div>
                  </td>

                  {/* Action: Detail button */}
                  <td className="py-4 px-4 sm:px-6 whitespace-nowrap text-right">
                    <button
                      type="button"
                      onClick={() => onViewDetail(topup)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-brand-200 text-brand-700 bg-brand-50/60 hover:bg-brand-100 hover:border-brand-300 transition-colors focus-ring cursor-pointer shadow-2xs"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Detail</span>
                    </button>
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
