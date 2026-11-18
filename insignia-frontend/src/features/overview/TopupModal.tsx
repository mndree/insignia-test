import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { topupSchema, TopupFormData } from '../auth/schemas';
import { topupApi } from '@/services/api/endpoints';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { formatNumber } from '@/utils/formatters';
import { normalizeApiError } from '@/services/api/client';
import { PlusCircle, Wallet, CheckCircle2 } from 'lucide-react';

interface TopupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_AMOUNTS = [100, 500, 1000, 5000];

export const TopupModal: React.FC<TopupModalProps> = ({ isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<TopupFormData>({
    resolver: zodResolver(topupSchema),
    defaultValues: {
      amount: 1000,
    },
  });

  const mutation = useMutation({
    mutationFn: topupApi,
    onSuccess: (_, variables) => {
      setSuccessMessage(`Successfully added ${formatNumber(variables.amount)} wallet units!`);
      // Invalidate balance and transaction queries
      queryClient.invalidateQueries({ queryKey: ['balance'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['top_transactions'] });
      reset();
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 1500);
    },
    onError: (err) => {
      const normalized = normalizeApiError(err);
      setErrorMessage(normalized.message);
    },
  });

  const onSubmit = (data: TopupFormData) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    mutation.mutate({ amount: data.amount });
  };

  const handleClose = () => {
    if (!mutation.isPending) {
      setErrorMessage(null);
      setSuccessMessage(null);
      reset();
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Top Up Wallet Balance"
      description="Add wallet units to your account. Amount must be between 1 and 9,999,999 units."
      size="md"
    >
      {errorMessage && (
        <Alert
          variant="error"
          title="Top-Up Failed"
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

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Top-Up Amount (units)"
          type="number"
          step="any"
          placeholder="e.g. 1000"
          disabled={mutation.isPending}
          error={errors.amount?.message}
          helperText="Backend rule: 0 < amount < 10,000,000 wallet units."
          leftIcon={<Wallet className="w-4 h-4" />}
          {...register('amount', { valueAsNumber: true })}
        />

        {/* Preset Amount Badges */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-navy-700 mb-1.5">
            Quick Presets
          </label>
          <div className="grid grid-cols-4 gap-2">
            {PRESET_AMOUNTS.map((preset) => (
              <button
                key={preset}
                type="button"
                disabled={mutation.isPending}
                onClick={() => setValue('amount', preset, { shouldValidate: true })}
                className="py-1.5 px-2 text-xs font-semibold rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 text-navy-800 transition-colors focus-ring"
              >
                +{formatNumber(preset)}
              </button>
            ))}
          </div>
        </div>

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
            isLoading={mutation.isPending}
            disabled={mutation.isPending}
          >
            <PlusCircle className="w-4 h-4 mr-1.5" />
            Confirm Top-Up
          </Button>
        </div>
      </form>
    </Modal>
  );
};
