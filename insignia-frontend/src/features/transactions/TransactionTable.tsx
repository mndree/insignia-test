import React from 'react';
import { TransactionRecordDto } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { formatDateTime, formatWalletUnits } from '@/utils/formatters';
import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight, Clock } from 'lucide-react';

interface TransactionTableProps {
  items: TransactionRecordDto[];
  isLoading: boolean;
}

export const TransactionTable: React.FC<TransactionTableProps> = ({ items, isLoading }) => {
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
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              <th scope="col" className="py-3 px-4 sm:px-6">Transaction ID</th>
              <th scope="col" className="py-3 px-4 sm:px-6">Counterparty</th>
              <th scope="col" className="py-3 px-4 sm:px-6">Direction</th>
              <th scope="col" className="py-3 px-4 sm:px-6 text-right">Amount</th>
              <th scope="col" className="py-3 px-4 sm:px-6 text-right">Date & Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {items.map((txn) => {
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
