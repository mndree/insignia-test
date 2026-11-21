import React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatNumber } from '@/utils/formatters';
import { Wallet, RefreshCw, Plus, Send } from 'lucide-react';

interface BalanceCardProps {
  balance: number;
  isLoading: boolean;
  isFetching: boolean;
  onRefresh: () => void;
  onOpenTopup: () => void;
  onOpenTransfer: () => void;
  canTopup?: boolean;
  canTransfer?: boolean;
}

export const BalanceCard: React.FC<BalanceCardProps> = ({
  balance,
  isLoading,
  isFetching,
  onRefresh,
  onOpenTopup,
  onOpenTransfer,
  canTopup = true,
  canTransfer = true,
}) => {
  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-white via-white to-slate-50 border border-slate-200/90 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-brand-50 text-brand-600">
              <Wallet className="w-5 h-5" />
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Wallet Balance
            </span>
            <button
              onClick={onRefresh}
              disabled={isFetching}
              title="Refresh wallet balance"
              className="p-1 text-slate-400 hover:text-navy-900 rounded-md hover:bg-slate-100 transition-colors focus-ring"
              aria-label="Refresh balance"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin text-brand-600' : ''}`}
              />
            </button>
          </div>

          <div className="flex items-baseline gap-2.5">
            {isLoading ? (
              <div className="h-10 w-44 bg-slate-200 animate-pulse rounded-lg" />
            ) : (
              <>
                <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-navy-900 font-mono">
                  {formatNumber(balance)}
                </span>
                <span className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
                  wallet units
                </span>
              </>
            )}
          </div>

          <p className="text-xs text-slate-400">
            Backend API: Single numeric wallet balance. No currency specified in Stoplight spec.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {canTopup && (
            <Button
              variant="outline"
              size="md"
              onClick={onOpenTopup}
              className="flex-1 md:flex-initial"
            >
              <Plus className="w-4 h-4 mr-1.5 text-brand-600" />
              Top Up
            </Button>
          )}

          {canTransfer && (
            <Button
              variant="primary"
              size="md"
              onClick={onOpenTransfer}
              className="flex-1 md:flex-initial"
            >
              <Send className="w-4 h-4 mr-1.5" />
              Transfer
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};
