import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { UserDetailsResponseDto, UserListItemDto } from '@/types';
import { adminTransferBalanceApi } from '@/services/api/endpoints';
import { UserAvatar } from './UserAvatar';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { formatNumber, formatWalletUnits } from '@/utils/formatters';
import { formatAmountInput, parseAmountInput } from '@/utils/masking';
import { normalizeApiError } from '@/services/api/client';
import { showSuccessAlert, showErrorAlert } from '@/utils/sweetalert';
import { X, Search, ChevronDown, CheckCircle2, AlertTriangle, ArrowRight, Info, Check } from 'lucide-react';

interface TransferBalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserDetailsResponseDto;
  availableUsers: UserListItemDto[];
}

export const TransferBalanceModal: React.FC<TransferBalanceModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  availableUsers,
}) => {
  const queryClient = useQueryClient();

  // Filter out the current user so they cannot transfer to themselves
  const potentialRecipients = availableUsers.filter(
    (u) =>
      u.id !== currentUser.id &&
      u.username.toLowerCase() !== currentUser.username.toLowerCase()
  );

  const [selectedRecipient, setSelectedRecipient] = useState<UserListItemDto | null>(() => {
    return potentialRecipients[0] || null;
  });

  const [amountInput, setAmountInput] = useState<string>('2,500');
  const [notes, setNotes] = useState<string>('Project payment');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [recipientSearch, setRecipientSearch] = useState('');
  const [isReviewStep, setIsReviewStep] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const numericAmount = Math.max(0, parseAmountInput(amountInput));
  const maxAvailable = currentUser.balance;
  const balanceAfter = Math.max(0, maxAvailable - numericAmount);

  const filteredRecipients = potentialRecipients.filter(
    (u) =>
      u.fullName.toLowerCase().includes(recipientSearch.toLowerCase()) ||
      u.username.toLowerCase().includes(recipientSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(recipientSearch.toLowerCase())
  );

  const mutation = useMutation({
    mutationFn: (data: { to_username: string; amount: number; notes?: string }) =>
      adminTransferBalanceApi(currentUser.id, data),
    onSuccess: (data) => {
      setSuccessMessage(
        `Transferred ${formatWalletUnits(data.amount)} to @${selectedRecipient?.username} successfully!`
      );
      showSuccessAlert(
        'Transfer Successful!',
        `Transferred ${formatWalletUnits(data.amount)} to @${selectedRecipient?.username} successfully!`
      );
      queryClient.invalidateQueries({ queryKey: ['admin_user_details', currentUser.id] });
      queryClient.invalidateQueries({ queryKey: ['admin_user_details', currentUser.username] });
      queryClient.invalidateQueries({ queryKey: ['admin_users'] });
      queryClient.invalidateQueries({ queryKey: ['balance'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });

      setTimeout(() => {
        setSuccessMessage(null);
        setIsReviewStep(false);
        onClose();
      }, 1500);
    },
    onError: (err) => {
      const normalized = normalizeApiError(err);
      setErrorMessage(normalized.message);
      showErrorAlert('Transfer Failed', normalized.message);
    },
  });

  if (!isOpen) return null;

  const handleReview = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedRecipient) {
      setErrorMessage('Please select a recipient.');
      return;
    }

    if (numericAmount <= 0) {
      setErrorMessage('Amount must be greater than 0.');
      return;
    }

    if (numericAmount > maxAvailable) {
      setErrorMessage(
        `Insufficient balance. You have ${formatWalletUnits(maxAvailable)}, but tried to transfer ${formatWalletUnits(numericAmount)}.`
      );
      return;
    }

    setIsReviewStep(true);
  };

  const handleConfirmTransfer = () => {
    if (!selectedRecipient) return;
    mutation.mutate({
      to_username: selectedRecipient.username,
      amount: numericAmount,
      notes: notes.trim() || undefined,
    });
  };

  const handleClose = () => {
    if (!mutation.isPending) {
      setIsReviewStep(false);
      setErrorMessage(null);
      setSuccessMessage(null);
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden transform transition-all">
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-xl font-bold tracking-tight text-navy-900">
              Transfer Balance
            </h3>
            <p className="mt-0.5 text-xs text-slate-500">
              Send balance from {currentUser.fullName || currentUser.username} to another user.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors focus-ring"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {errorMessage && (
            <Alert variant="error" title="Transfer Error" onClose={() => setErrorMessage(null)}>
              {errorMessage}
            </Alert>
          )}

          {successMessage && (
            <Alert variant="success">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span className="font-semibold text-emerald-950">{successMessage}</span>
              </div>
            </Alert>
          )}

          {/* Sender Card */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <UserAvatar name={currentUser.fullName || currentUser.username} size="lg" />
              <div>
                <h4 className="text-sm font-bold text-navy-900 leading-snug">
                  {currentUser.fullName}
                </h4>
                <p className="text-xs font-mono text-slate-500">
                  @{currentUser.username}
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                Available balance
              </span>
              <span className="text-base font-extrabold text-navy-900 font-mono">
                {formatWalletUnits(currentUser.balance)}
              </span>
            </div>
          </div>

          {isReviewStep ? (
            /* Confirmation Step */
            <div className="space-y-4 animate-in fade-in">
              <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-100 text-xs text-navy-800 space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Recipient:</span>
                  <span className="font-semibold text-navy-900 font-mono">
                    {selectedRecipient?.fullName} (@{selectedRecipient?.username})
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Amount to send:</span>
                  <span className="font-bold text-outgoing font-mono text-sm">
                    -{formatWalletUnits(numericAmount)}
                  </span>
                </div>
                {notes && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Notes:</span>
                    <span className="font-medium text-navy-800">{notes}</span>
                  </div>
                )}
                <div className="border-t border-indigo-200/80 pt-2 flex justify-between items-center font-bold">
                  <span className="text-slate-600">Sender Balance After:</span>
                  <span className="text-navy-900 font-mono">
                    {formatWalletUnits(balanceAfter)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200/80 rounded-xl text-xs text-amber-800">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Transfers are executed immediately and cannot be reversed.</span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsReviewStep(false)}
                  disabled={mutation.isPending}
                >
                  Back
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  isLoading={mutation.isPending}
                  disabled={mutation.isPending}
                  onClick={handleConfirmTransfer}
                >
                  <Check className="w-4 h-4 mr-1.5" />
                  Confirm & Transfer
                </Button>
              </div>
            </div>
          ) : (
            /* Form Step */
            <form onSubmit={handleReview} className="space-y-4">
              {/* Recipient Picker */}
              <div className="relative">
                <label className="block text-xs font-semibold uppercase tracking-wider text-navy-700 mb-1.5">
                  Recipient
                </label>

                <div
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 flex items-center justify-between cursor-pointer hover:border-slate-400 transition-colors focus-ring"
                >
                  {selectedRecipient ? (
                    <div className="flex items-center gap-3 min-w-0">
                      <UserAvatar name={selectedRecipient.fullName || selectedRecipient.username} size="sm" />
                      <div className="min-w-0">
                        <span className="block text-xs font-bold text-navy-900 truncate">
                          {selectedRecipient.fullName}
                        </span>
                        <span className="block text-[11px] text-slate-400 font-mono truncate">
                          @{selectedRecipient.username} • {selectedRecipient.email}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400">Select a recipient...</span>
                  )}
                  <div className="flex items-center gap-1.5 text-slate-400 shrink-0">
                    <Search className="w-4 h-4" />
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 z-30 bg-white border border-slate-200 rounded-xl shadow-xl max-h-56 overflow-y-auto custom-scrollbar p-1">
                    <div className="p-2 border-b border-slate-100 sticky top-0 bg-white">
                      <input
                        type="text"
                        placeholder="Search recipient name, username or email..."
                        value={recipientSearch}
                        onChange={(e) => setRecipientSearch(e.target.value)}
                        className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg focus-ring"
                        autoFocus
                      />
                    </div>
                    {filteredRecipients.length === 0 ? (
                      <div className="p-3 text-xs text-slate-400 text-center">
                        No matching recipients found
                      </div>
                    ) : (
                      filteredRecipients.map((user) => (
                        <div
                          key={user.id}
                          onClick={() => {
                            setSelectedRecipient(user);
                            setIsDropdownOpen(false);
                            setRecipientSearch('');
                          }}
                          className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                        >
                          <UserAvatar name={user.fullName || user.username} size="sm" />
                          <div className="min-w-0 flex-1">
                            <span className="block text-xs font-semibold text-navy-900 truncate">
                              {user.fullName}
                            </span>
                            <span className="block text-[10px] text-slate-400 truncate">
                              @{user.username} • {user.email}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Amount Input */}
              <div>
                <label
                  htmlFor="transferAmountInput"
                  className="block text-xs font-semibold uppercase tracking-wider text-navy-700 mb-1.5"
                >
                  Amount
                </label>
                <div className="relative flex items-center">
                  <input
                    id="transferAmountInput"
                    type="text"
                    inputMode="decimal"
                    value={amountInput}
                    onChange={(e) => setAmountInput(formatAmountInput(e.target.value))}
                    placeholder="2,500"
                    className="w-full bg-white text-navy-900 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm transition-colors hover:border-slate-400 focus-ring font-mono font-bold pr-16"
                  />
                  <span className="absolute right-3.5 text-xs font-semibold text-slate-400 pointer-events-none select-none">
                    units
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-slate-500 font-medium">
                  Maximum available: {formatWalletUnits(maxAvailable)}
                </p>
              </div>

              {/* Notes Field */}
              <div>
                <label
                  htmlFor="transferNotesInput"
                  className="block text-xs font-semibold uppercase tracking-wider text-navy-700 mb-1.5"
                >
                  Notes (optional)
                </label>
                <textarea
                  id="transferNotesInput"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Project payment"
                  className="w-full bg-white text-navy-900 border border-slate-300 rounded-xl px-3 py-2 text-xs transition-colors hover:border-slate-400 focus-ring"
                />
              </div>

              {/* Calculation Summary Box (pale blue / gray) */}
              <div className="p-3.5 rounded-xl bg-slate-50/90 border border-slate-200/80 text-xs space-y-2">
                <div className="flex items-center justify-between text-slate-600">
                  <span>Transfer amount</span>
                  <span className="font-mono font-bold text-navy-900">
                    {formatNumber(numericAmount)} units
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Balance after transfer</span>
                  <span className="font-mono font-bold text-navy-900">
                    {formatNumber(balanceAfter)} units
                  </span>
                </div>
              </div>

              {/* Verification Info Notice */}
              <div className="flex items-center gap-2 text-[11px] text-slate-500">
                <Info className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                <span>Please verify the recipient and amount before continuing.</span>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={numericAmount <= 0 || numericAmount > maxAvailable}
                >
                  Review Transfer
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
