import React, { useState, useEffect } from 'react';
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
import { formatAmountInput, parseAmountInput } from '@/utils/masking';
import { normalizeApiError } from '@/services/api/client';
import { showSuccessAlert, showErrorAlert } from '@/utils/sweetalert';
import { PlusCircle, Wallet, CheckCircle2, UploadCloud, Trash2 } from 'lucide-react';

interface TopupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_AMOUNTS = [100, 500, 1000, 5000];

export const TopupModal: React.FC<TopupModalProps> = ({ isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [displayAmount, setDisplayAmount] = useState<string>('1,000');
  const [attachment, setAttachment] = useState<string | null>(null);
  const [attachmentName, setAttachmentName] = useState<string>('');
  const [attachmentSize, setAttachmentSize] = useState<string>('');
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

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

  useEffect(() => {
    register('amount');
  }, [register]);

  const mutation = useMutation({
    mutationFn: topupApi,
    onSuccess: (_, variables) => {
      setSuccessMessage(`Successfully added ${formatNumber(variables.amount)} wallet units!`);
      showSuccessAlert('Top-up Successful!', `Successfully added ${formatNumber(variables.amount)} wallet units to your account.`);
      // Invalidate balance and transaction queries
      queryClient.invalidateQueries({ queryKey: ['balance'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['top_transactions'] });
      reset({ amount: 1000 });
      setDisplayAmount('1,000');
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 1500);
    },
    onError: (err) => {
      const normalized = normalizeApiError(err);
      setErrorMessage(normalized.message);
      showErrorAlert('Top-up Failed', normalized.message);
    },
  });

  const onSubmit = (data: TopupFormData) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    if (!attachment) {
      setErrorMessage('Proof of payment / receipt attachment is required.');
      showErrorAlert('Attachment Required', 'Please attach proof of payment / transaction receipt before submitting.');
      return;
    }
    mutation.mutate({ amount: data.amount, attachment });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Attachment file size must be less than 5MB');
      showErrorAlert('File Too Large', 'Attachment file size must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setAttachment(result);
      setAttachmentName(file.name);
      setAttachmentSize((file.size / 1024).toFixed(1) + ' KB');
      setErrorMessage(null);
    };
    reader.onerror = () => {
      setErrorMessage('Failed to read file');
      showErrorAlert('File Read Error', 'Failed to read attachment file');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAttachment = () => {
    setAttachment(null);
    setAttachmentName('');
    setAttachmentSize('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    if (!mutation.isPending) {
      setErrorMessage(null);
      setSuccessMessage(null);
      reset({ amount: 1000 });
      setDisplayAmount('1,000');
      handleRemoveAttachment();
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
          type="text"
          inputMode="decimal"
          placeholder="e.g. 1,000"
          disabled={mutation.isPending}
          error={errors.amount?.message}
          helperText="Backend rule: 0 < amount < 10,000,000 wallet units."
          leftIcon={<Wallet className="w-4 h-4" />}
          value={displayAmount}
          onChange={(e) => {
            const formatted = formatAmountInput(e.target.value);
            setDisplayAmount(formatted);
            const num = formatted === '' ? (NaN as any) : parseAmountInput(formatted);
            setValue('amount', num, { shouldValidate: true });
          }}
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
                onClick={() => {
                  setDisplayAmount(formatAmountInput(preset));
                  setValue('amount', preset, { shouldValidate: true });
                }}
                className="py-1.5 px-2 text-xs font-semibold rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 text-navy-800 transition-colors focus-ring"
              >
                +{formatNumber(preset)}
              </button>
            ))}
          </div>
        </div>

        {/* Attachment Input (Mandatory) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="user-topup-attachment" className="block text-xs font-semibold uppercase tracking-wider text-navy-700">
              Attachment (Proof of Receipt) <span className="text-rose-500">*</span>
            </label>
            <span className="text-[11px] text-rose-500 font-semibold">Mandatory</span>
          </div>

          <input
            ref={fileInputRef}
            id="user-topup-attachment"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
            disabled={mutation.isPending}
          />

          {!attachment ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="group border-2 border-dashed border-slate-300 hover:border-brand-500 bg-slate-50/60 hover:bg-brand-50/30 rounded-xl p-3.5 flex flex-col items-center justify-center cursor-pointer transition-colors"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
            >
              <div className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-brand-100 text-slate-500 group-hover:text-brand-600 flex items-center justify-center transition-colors mb-1">
                <UploadCloud className="w-4 h-4" />
              </div>
              <p className="text-xs font-semibold text-navy-800">
                <span className="text-brand-600 underline">Click to upload</span> receipt attachment
              </p>
              <p className="text-[11px] text-slate-400">JPG, PNG up to 5MB (Required)</p>
            </div>
          ) : (
            <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-slate-50/80">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <img
                  src={attachment}
                  alt="Receipt preview"
                  className="w-10 h-10 object-cover rounded-lg border border-slate-200 shadow-xs shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-navy-900 truncate">
                    {attachmentName || 'receipt.jpg'}
                  </p>
                  <p className="text-[10px] text-slate-500">{attachmentSize}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={mutation.isPending}
                  className="text-xs font-semibold text-brand-600 hover:text-brand-700 px-2 py-0.5 rounded hover:bg-brand-50 transition-colors"
                >
                  Change
                </button>
                <button
                  type="button"
                  onClick={handleRemoveAttachment}
                  disabled={mutation.isPending}
                  className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors"
                  aria-label="Remove attachment"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
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
