import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { UserDetailsResponseDto, AdminTopupRequestDto } from '@/types';
import { adminTopupBalanceApi } from '@/services/api/endpoints';
import { UserAvatar } from './UserAvatar';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { formatNumber } from '@/utils/formatters';
import { normalizeApiError } from '@/services/api/client';
import { showSuccessAlert, showErrorAlert } from '@/utils/sweetalert';
import { X, CheckCircle2, PlusCircle, Wallet, ShieldCheck } from 'lucide-react';

interface AdminTopupModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserDetailsResponseDto;
}

const PRESET_AMOUNTS = [100, 500, 1000, 5000, 10000];

export const AdminTopupModal: React.FC<AdminTopupModalProps> = ({
  isOpen,
  onClose,
  user,
}) => {
  const queryClient = useQueryClient();

  const [amountInput, setAmountInput] = useState<string>('1000');
  const [notes, setNotes] = useState<string>('Admin credit adjustment');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const numericAmount = Math.max(0, parseFloat(amountInput) || 0);
  const currentBalance = user.balance;
  const balanceAfter = currentBalance + numericAmount;

  const mutation = useMutation({
    mutationFn: (data: AdminTopupRequestDto) =>
      adminTopupBalanceApi(user.id, data),
    onSuccess: (data) => {
      setSuccessMessage(
        `Successfully credited ${formatNumber(data.amount)} units to @${user.username}! (Code: ${data.topupCode || 'TOP-OK'})`
      );
      showSuccessAlert(
        'Top-up Successful!',
        `Successfully credited ${formatNumber(data.amount)} units to @${user.username}!`
      );
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['admin_user_details', user.id] });
      queryClient.invalidateQueries({ queryKey: ['admin_user_details', user.username] });
      queryClient.invalidateQueries({ queryKey: ['admin_users'] });
      queryClient.invalidateQueries({ queryKey: ['balance'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });

      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 1400);
    },
    onError: (err) => {
      const normalized = normalizeApiError(err);
      setErrorMessage(normalized.message);
      showErrorAlert('Top-up Failed', normalized.message);
    },
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (numericAmount <= 0) {
      setErrorMessage('Top up amount must be greater than 0.');
      return;
    }

    mutation.mutate({
      amount: numericAmount,
      notes: notes.trim() || undefined,
    });
  };

  const handleClose = () => {
    if (!mutation.isPending) {
      setErrorMessage(null);
      setSuccessMessage(null);
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-topup-title"
    >
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden transform transition-all">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-100 text-brand-600 flex items-center justify-center">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 id="admin-topup-title" className="text-base font-bold text-navy-900">
                  Top Up Wallet Balance
                </h3>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 text-brand-700 border border-indigo-100">
                  <ShieldCheck className="w-3 h-3" />
                  Admin Action
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Credit wallet units directly to @{user.username}'s account
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={mutation.isPending}
            className="p-1.5 text-slate-400 hover:text-navy-900 rounded-lg hover:bg-slate-200/50 transition-colors focus-ring"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {errorMessage && (
            <Alert
              variant="error"
              title="Top Up Failed"
              onClose={() => setErrorMessage(null)}
            >
              {errorMessage}
            </Alert>
          )}

          {successMessage && (
            <Alert variant="success">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span className="font-medium text-emerald-900 text-sm">{successMessage}</span>
              </div>
            </Alert>
          )}

          {/* User Target Card */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <UserAvatar name={user.fullName} size="md" />
              <div>
                <p className="text-xs font-semibold text-navy-900">{user.fullName}</p>
                <p className="text-[11px] font-mono text-slate-400">
                  @{user.username} {user.userCode && `(${user.userCode})`}
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400 block">
                Current Balance
              </span>
              <span className="text-sm font-bold text-navy-900 font-mono">
                {formatNumber(user.balance)} <span className="text-[11px] font-sans font-normal text-slate-500">units</span>
              </span>
            </div>
          </div>

          {/* Amount Field */}
          <div className="space-y-2">
            <label htmlFor="topup-amount" className="block text-xs font-bold uppercase tracking-wider text-navy-700">
              Top Up Amount (Units) <span className="text-rose-500">*</span>
            </label>
            <div className="relative rounded-xl shadow-xs">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-bold text-sm">
                +
              </div>
              <input
                id="topup-amount"
                type="number"
                min="1"
                step="any"
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                placeholder="0"
                required
                disabled={mutation.isPending}
                className="w-full pl-8 pr-16 py-2.5 rounded-xl border border-slate-200 bg-white text-navy-900 font-mono font-bold text-lg placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
              />
              <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-xs font-semibold text-slate-400 uppercase tracking-wide">
                units
              </div>
            </div>

            {/* Quick Preset Buttons */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] text-slate-400 font-medium mr-1">Presets:</span>
              {PRESET_AMOUNTS.map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setAmountInput(String(val))}
                  disabled={mutation.isPending}
                  className={`text-xs px-2.5 py-1 rounded-lg border font-mono transition-colors ${
                    numericAmount === val
                      ? 'bg-brand-50 border-brand-300 text-brand-700 font-bold'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-navy-900'
                  }`}
                >
                  +{formatNumber(val)}
                </button>
              ))}
            </div>
          </div>

          {/* Notes Field */}
          <div className="space-y-1.5">
            <label htmlFor="topup-notes" className="block text-xs font-bold uppercase tracking-wider text-navy-700">
              Notes / Memo <span className="text-slate-400 font-normal capitalize">(Optional)</span>
            </label>
            <input
              id="topup-notes"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Monthly top up, Operational disbursement"
              maxLength={100}
              disabled={mutation.isPending}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-navy-900 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
            />
          </div>

          {/* Calculation Summary Box */}
          <div className="p-4 rounded-xl bg-slate-50/90 border border-slate-200/80 space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-500 font-medium">
              <span>Current balance:</span>
              <span className="font-mono text-navy-800">{formatNumber(currentBalance)} units</span>
            </div>
            <div className="flex items-center justify-between text-brand-700 font-medium">
              <span>Top up addition:</span>
              <span className="font-mono font-bold">+{formatNumber(numericAmount)} units</span>
            </div>
            <div className="pt-2 border-t border-slate-200 flex items-center justify-between font-bold text-navy-900">
              <span className="flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5 text-brand-600" />
                Balance after top up:
              </span>
              <span className="font-mono text-sm text-brand-600 font-extrabold">
                {formatNumber(balanceAfter)} units
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={handleClose}
              disabled={mutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={numericAmount <= 0 || mutation.isPending}
              className="min-w-[140px]"
            >
              {mutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Confirm Top Up
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
