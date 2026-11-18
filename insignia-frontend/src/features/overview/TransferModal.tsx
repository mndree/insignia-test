import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { transferSchema, TransferFormData } from '../auth/schemas';
import { transferApi } from '@/services/api/endpoints';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { formatWalletUnits } from '@/utils/formatters';
import { normalizeApiError } from '@/services/api/client';
import { Send, User, Coins, AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBalance: number;
}

export const TransferModal: React.FC<TransferModalProps> = ({
  isOpen,
  onClose,
  currentBalance,
}) => {
  const queryClient = useQueryClient();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [pendingTransfer, setPendingTransfer] = useState<TransferFormData | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TransferFormData>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      to_username: '',
      amount: 100,
    },
  });

  const mutation = useMutation({
    mutationFn: transferApi,
    onSuccess: (_, variables) => {
      setSuccessMessage(
        `Successfully transferred ${formatWalletUnits(variables.amount)} to @${variables.to_username}!`
      );
      // Invalidate all affected queries
      queryClient.invalidateQueries({ queryKey: ['balance'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['top_transactions'] });
      queryClient.invalidateQueries({ queryKey: ['top_users'] });

      setPendingTransfer(null);
      reset();
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 1600);
    },
    onError: (err) => {
      const normalized = normalizeApiError(err);
      setErrorMessage(normalized.message);
      setPendingTransfer(null);
    },
  });

  const onPreSubmit = (data: TransferFormData) => {
    setErrorMessage(null);
    setSuccessMessage(null);

    // Validate available balance
    if (data.amount > currentBalance) {
      setErrorMessage(
        `Insufficient balance. You have ${formatWalletUnits(currentBalance)}, but attempted to transfer ${formatWalletUnits(data.amount)}.`
      );
      return;
    }

    // Move to confirmation step
    setPendingTransfer(data);
  };

  const handleConfirmTransfer = () => {
    if (pendingTransfer && !mutation.isPending) {
      mutation.mutate(pendingTransfer);
    }
  };

  const handleClose = () => {
    if (!mutation.isPending) {
      setErrorMessage(null);
      setSuccessMessage(null);
      setPendingTransfer(null);
      reset();
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={pendingTransfer ? 'Confirm Balance Transfer' : 'Transfer Wallet Units'}
      description={
        pendingTransfer
          ? 'Please review the transfer details below before confirming.'
          : 'Send wallet units to another registered username.'
      }
      size="md"
    >
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
            <span className="font-medium text-emerald-900">{successMessage}</span>
          </div>
        </Alert>
      )}

      {pendingTransfer ? (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Recipient Username:</span>
              <span className="font-semibold text-navy-900 font-mono">
                @{pendingTransfer.to_username}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Transfer Amount:</span>
              <span className="font-bold text-outgoing">
                -{formatWalletUnits(pendingTransfer.amount)}
              </span>
            </div>
            <div className="border-t border-slate-200 pt-2 flex items-center justify-between text-xs">
              <span className="text-slate-500">Remaining Balance:</span>
              <span className="font-medium text-navy-800">
                {formatWalletUnits(currentBalance - pendingTransfer.amount)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200/80 rounded-xl text-xs text-amber-800">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>This transfer cannot be undone once confirmed.</span>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setPendingTransfer(null)}
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
              <Send className="w-4 h-4 mr-1.5" />
              Confirm & Send
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onPreSubmit)} className="space-y-4">
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/60 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Available Balance:</span>
            <span className="font-bold text-navy-900">{formatWalletUnits(currentBalance)}</span>
          </div>

          <Input
            label="Recipient Username"
            type="text"
            placeholder="e.g. azra"
            disabled={mutation.isPending}
            error={errors.to_username?.message}
            helperText="The recipient must be a registered username."
            leftIcon={<User className="w-4 h-4" />}
            {...register('to_username')}
          />

          <Input
            label="Transfer Amount (units)"
            type="number"
            step="any"
            placeholder="e.g. 250"
            disabled={mutation.isPending}
            error={errors.amount?.message}
            leftIcon={<Coins className="w-4 h-4" />}
            {...register('amount', { valueAsNumber: true })}
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="ghost"
              onClick={handleClose}
              disabled={mutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={mutation.isPending || currentBalance <= 0}
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
