import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/useAuth';
import { getUsersListApi, adminTransferBalanceApi } from '@/services/api/endpoints';
import { UserListItemDto } from '@/types';
import { UserSelect } from '@/components/ui/UserSelect';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { formatWalletUnits, formatNumber } from '@/utils/formatters';
import { normalizeApiError } from '@/services/api/client';
import { Send, ArrowRight, CheckCircle2, AlertTriangle, ShieldCheck, Wallet } from 'lucide-react';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBalance?: number;
}

const PRESET_AMOUNTS = [100, 500, 1000, 5000];

export const TransferModal: React.FC<TransferModalProps> = ({
  isOpen,
  onClose,
  currentBalance: initialCurrentBalance,
}) => {
  const { user: authUser } = useAuth();
  const queryClient = useQueryClient();

  // Modal is restricted exclusively to Admin
  const isAdmin = !authUser || authUser.role === 'ADMIN';

  // Fetch all users for From and To Select2 dropdowns (strictly excluding admin)
  const { data: usersData, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['admin_users_all'],
    queryFn: () => getUsersListApi({ pageSize: 200 }),
    enabled: isOpen && isAdmin,
  });

  const availableUsers: UserListItemDto[] = (usersData?.items || []).filter(
    (u) => u.username.toLowerCase() !== 'admin'
  );

  const [fromUser, setFromUser] = useState<UserListItemDto | null>(null);
  const [toUser, setToUser] = useState<UserListItemDto | null>(null);
  const [amountInput, setAmountInput] = useState<string>('100');
  const [notes, setNotes] = useState<string>('Balance transfer');
  const [isReviewStep, setIsReviewStep] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Set intelligent defaults once users list loads (only regular users, never admin)
  useEffect(() => {
    if (availableUsers.length > 0) {
      const defaultSender =
        fromUser ||
        availableUsers.find((u) => u.balance > 0) ||
        availableUsers[0];

      if (!fromUser && defaultSender) {
        setFromUser(defaultSender);
      }

      if (!toUser && defaultSender) {
        const defaultRecipient = availableUsers.find(
          (u) =>
            u.id !== defaultSender.id &&
            u.username.toLowerCase() !== defaultSender.username.toLowerCase()
        );
        if (defaultRecipient) {
          setToUser(defaultRecipient);
        }
      }
    }
  }, [availableUsers, fromUser, toUser]);

  // Keep sender balance updated
  const senderBalance = fromUser ? fromUser.balance : (initialCurrentBalance ?? 0);
  const numericAmount = Math.max(0, parseFloat(amountInput) || 0);
  const senderBalanceAfter = Math.max(0, senderBalance - numericAmount);
  const recipientBalanceAfter = toUser ? toUser.balance + numericAmount : 0;

  const mutation = useMutation({
    mutationFn: (data: { fromUserId: string; to_username: string; amount: number; notes?: string }) =>
      adminTransferBalanceApi(data.fromUserId, {
        to_username: data.to_username,
        amount: data.amount,
        notes: data.notes,
      }),
    onSuccess: (data) => {
      setSuccessMessage(
        `Successfully transferred ${formatWalletUnits(data.amount)} from @${fromUser?.username} to @${toUser?.username}! (Code: ${data.transferCode || 'TXN-OK'})`
      );

      // Invalidate all related financial & transaction queries
      queryClient.invalidateQueries({ queryKey: ['balance'] });
      queryClient.invalidateQueries({ queryKey: ['wallet_balance'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['top_transactions'] });
      queryClient.invalidateQueries({ queryKey: ['top_users'] });
      queryClient.invalidateQueries({ queryKey: ['admin_users'] });
      queryClient.invalidateQueries({ queryKey: ['admin_users_all'] });
      queryClient.invalidateQueries({ queryKey: ['admin_user_details'] });

      setTimeout(() => {
        setSuccessMessage(null);
        setIsReviewStep(false);
        onClose();
      }, 1600);
    },
    onError: (err) => {
      const normalized = normalizeApiError(err);
      setErrorMessage(normalized.message);
    },
  });

  // Guard: If modal is not open or user is not Admin, do not render
  if (!isOpen || !isAdmin) {
    return null;
  }

  const handleReview = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!fromUser) {
      setErrorMessage('Please select a sender (From User).');
      return;
    }

    if (!toUser) {
      setErrorMessage('Please select a recipient (To User).');
      return;
    }

    if (fromUser.id === toUser.id || fromUser.username.toLowerCase() === toUser.username.toLowerCase()) {
      setErrorMessage('Sender and recipient cannot be the same account.');
      return;
    }

    if (numericAmount <= 0) {
      setErrorMessage('Transfer amount must be greater than 0.');
      return;
    }

    if (numericAmount > senderBalance) {
      setErrorMessage(
        `Insufficient balance. @${fromUser.username} has ${formatWalletUnits(senderBalance)}, but you tried to transfer ${formatWalletUnits(numericAmount)}.`
      );
      return;
    }

    setIsReviewStep(true);
  };

  const handleConfirmTransfer = () => {
    if (!fromUser || !toUser || mutation.isPending) return;

    mutation.mutate({
      fromUserId: fromUser.id,
      to_username: toUser.username,
      amount: numericAmount,
      notes: notes.trim() || undefined,
    });
  };

  const handleClose = () => {
    if (!mutation.isPending) {
      setErrorMessage(null);
      setSuccessMessage(null);
      setIsReviewStep(false);
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isReviewStep ? 'Confirm Balance Transfer' : 'Transfer Wallet Units'}
      description={
        isReviewStep
          ? 'Please review the sender and recipient details before finalizing the transfer.'
          : 'Admin transfer between registered accounts. Select sender and recipient from dropdowns.'
      }
      size="lg"
    >
      {/* Admin Badge */}
      <div className="mb-4 flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-indigo-50 text-brand-700 border border-indigo-100">
          <ShieldCheck className="w-3.5 h-3.5" />
          Admin Controlled Transfer
        </span>
      </div>

      {errorMessage && (
        <Alert
          variant="error"
          title="Transfer Error"
          className="mb-4"
          onClose={() => setErrorMessage(null)}
        >
          {errorMessage}
        </Alert>
      )}

      {successMessage && (
        <Alert variant="success" className="mb-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-semibold text-emerald-950 text-sm">{successMessage}</span>
          </div>
        </Alert>
      )}

      {isReviewStep ? (
        /* Confirmation / Review Step */
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-3 border-b border-slate-200/80">
              {/* Sender Details */}
              <div className="p-3 bg-white rounded-lg border border-slate-200/80 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  From (Sender)
                </span>
                <p className="font-bold text-navy-900 text-sm">{fromUser?.fullName}</p>
                <p className="font-mono text-slate-500">@{fromUser?.username}</p>
                <div className="pt-1 text-[11px] text-slate-600">
                  Balance After: <span className="font-mono font-bold text-navy-900">{formatNumber(senderBalanceAfter)} units</span>
                </div>
              </div>

              {/* Recipient Details */}
              <div className="p-3 bg-white rounded-lg border border-slate-200/80 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  To (Recipient)
                </span>
                <p className="font-bold text-navy-900 text-sm">{toUser?.fullName}</p>
                <p className="font-mono text-slate-500">@{toUser?.username}</p>
                <div className="pt-1 text-[11px] text-slate-600">
                  Balance After: <span className="font-mono font-bold text-emerald-700">{formatNumber(recipientBalanceAfter)} units</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between py-1 text-sm">
              <span className="text-slate-500 font-medium">Transfer Amount:</span>
              <span className="font-bold font-mono text-outgoing text-base">
                -{formatWalletUnits(numericAmount)}
              </span>
            </div>

            {notes && (
              <div className="flex items-center justify-between py-1 text-xs">
                <span className="text-slate-500">Notes / Memo:</span>
                <span className="font-medium text-navy-900">{notes}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200/80 rounded-xl text-xs text-amber-800">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>This transfer cannot be undone once confirmed. Funds will update immediately.</span>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setIsReviewStep(false)}
              disabled={mutation.isPending}
            >
              Back
            </Button>
            <Button
              type="button"
              variant="primary"
              size="md"
              isLoading={mutation.isPending}
              disabled={mutation.isPending}
              onClick={handleConfirmTransfer}
            >
              <Send className="w-4 h-4 mr-1.5" />
              Confirm & Transfer
            </Button>
          </div>
        </div>
      ) : (
        /* Form Step */
        <form onSubmit={handleReview} className="space-y-4">
          {/* 1. FROM USER (Searchable Dropdown) */}
          <UserSelect
            label="From (Sender Account)"
            users={availableUsers}
            selectedUser={fromUser}
            onSelect={(selected) => {
              setFromUser(selected);
              if (toUser && toUser.id === selected.id) {
                setToUser(null);
              }
            }}
            excludeUserId={toUser?.id}
            placeholder={isLoadingUsers ? 'Loading registered users...' : 'Search & select sender...'}
            required
            disabled={mutation.isPending || isLoadingUsers}
          />

          {/* Dynamic Available Balance Banner */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-500 font-medium">
              <Wallet className="w-4 h-4 text-brand-600" />
              <span>Available Balance:</span>
            </div>
            <span className="font-extrabold text-navy-900 font-mono text-sm">
              {formatWalletUnits(senderBalance)}
            </span>
          </div>

          {/* 2. TO USER (Searchable Dropdown) */}
          <UserSelect
            label="To (Recipient Account)"
            users={availableUsers}
            selectedUser={toUser}
            onSelect={(selected) => {
              setToUser(selected);
              if (fromUser && fromUser.id === selected.id) {
                setFromUser(null);
              }
            }}
            excludeUserId={fromUser?.id}
            placeholder={isLoadingUsers ? 'Loading registered users...' : 'Search & select recipient...'}
            required
            disabled={mutation.isPending || isLoadingUsers}
          />

          {/* Transfer Amount Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="transfer-amount" className="block text-xs font-bold uppercase tracking-wider text-navy-700">
                Transfer Amount (Units) <span className="text-rose-500">*</span>
              </label>
              {fromUser && senderBalance > 0 && (
                <button
                  type="button"
                  onClick={() => setAmountInput(String(senderBalance))}
                  className="text-[11px] font-semibold text-brand-600 hover:text-brand-700 transition-colors"
                >
                  Use Max ({formatNumber(senderBalance)})
                </button>
              )}
            </div>

            <div className="relative rounded-xl shadow-xs">
              <input
                id="transfer-amount"
                type="number"
                min="1"
                step="any"
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                placeholder="0"
                required
                disabled={mutation.isPending}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-navy-900 font-mono font-bold text-base placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors pr-16"
              />
              <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-xs font-semibold text-slate-400 uppercase tracking-wide">
                units
              </div>
            </div>

            {/* Presets */}
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

          {/* Notes Input */}
          <div className="space-y-1.5">
            <label htmlFor="transfer-notes" className="block text-xs font-bold uppercase tracking-wider text-navy-700">
              Notes / Description <span className="text-slate-400 font-normal capitalize">(Optional)</span>
            </label>
            <input
              id="transfer-notes"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Project payout, Operational adjustment"
              maxLength={120}
              disabled={mutation.isPending}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs text-navy-900 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
            />
          </div>

          {/* Real-time Calculation Summary Box */}
          {fromUser && toUser && numericAmount > 0 && (
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-1.5 animate-in fade-in">
              <div className="flex justify-between text-slate-600">
                <span>Sender balance after:</span>
                <span className="font-mono font-semibold text-navy-900">
                  {formatNumber(senderBalanceAfter)} units
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Recipient balance after:</span>
                <span className="font-mono font-semibold text-emerald-700">
                  {formatNumber(recipientBalanceAfter)} units
                </span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
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
              disabled={
                mutation.isPending ||
                !fromUser ||
                !toUser ||
                numericAmount <= 0
              }
            >
              Review Transfer
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};
