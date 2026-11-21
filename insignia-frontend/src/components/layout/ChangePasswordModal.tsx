import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { changePasswordApi } from '@/services/api/endpoints';
import { normalizeApiError } from '@/services/api/client';
import { showSuccessAlert, showErrorAlert } from '@/utils/sweetalert';
import { Lock, Eye, EyeOff, Info, CheckCircle2 } from 'lucide-react';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
  username,
}) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (dto: { username: string; newPassword: string; currentPassword?: string }) =>
      changePasswordApi(dto),
    onSuccess: () => {
      setSuccessMessage('Password changed successfully!');
      showSuccessAlert('Password Changed', 'Your account password has been updated successfully.');
      setTimeout(() => {
        setSuccessMessage(null);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        onClose();
      }, 1200);
    },
    onError: (err) => {
      const normalized = normalizeApiError(err);
      setErrorMessage(normalized.message);
      showErrorAlert('Password Update Failed', normalized.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!newPassword || newPassword.length < 8) {
      const msg = 'Use at least 8 characters with uppercase, lowercase, numbers, and symbols.';
      setErrorMessage(msg);
      showErrorAlert('Validation Error', msg);
      return;
    }

    if (currentPassword && newPassword === currentPassword) {
      const msg = 'Your new password must be different from your current password.';
      setErrorMessage(msg);
      showErrorAlert('Validation Error', msg);
      return;
    }

    if (newPassword !== confirmPassword) {
      const msg = 'New password and confirmation password do not match.';
      setErrorMessage(msg);
      showErrorAlert('Validation Error', msg);
      return;
    }

    mutation.mutate({
      username,
      currentPassword: currentPassword || undefined,
      newPassword,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Change Password"
      description="Enter your current password and choose a new one."
      icon={
        <div className="w-10 h-10 rounded-xl border border-indigo-200 bg-indigo-50/80 flex items-center justify-center text-brand-600 shrink-0 shadow-2xs">
          <Lock className="w-5 h-5 stroke-[2.2]" />
        </div>
      }
      size="md"
    >
      <div className="space-y-4">
        {errorMessage && (
          <Alert variant="error" title="Password Update Failed">
            {errorMessage}
          </Alert>
        )}

        {successMessage && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Current Password */}
          <div>
            <label className="block text-xs font-semibold text-navy-900 mb-1.5">
              Current Password
            </label>
            <div className="relative">
              <Input
                type={showCurrentPassword ? 'text' : 'password'}
                placeholder="••••••••••••"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                tabIndex={-1}
                aria-label="Toggle password visibility"
              >
                {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-xs font-semibold text-navy-900 mb-1.5">
              New Password
            </label>
            <div className="relative">
              <Input
                type={showNewPassword ? 'text' : 'password'}
                placeholder="••••••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                tabIndex={-1}
                aria-label="Toggle password visibility"
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Use at least 8 characters with uppercase, lowercase, numbers, and symbols.
            </p>
          </div>

          {/* Confirm New Password */}
          <div>
            <label className="block text-xs font-semibold text-navy-900 mb-1.5">
              Confirm New Password
            </label>
            <div className="relative">
              <Input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="••••••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                tabIndex={-1}
                aria-label="Toggle password visibility"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Info Banner */}
          <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-100 flex items-center gap-2.5 text-xs text-brand-900 font-medium select-none">
            <Info className="w-4 h-4 text-brand-600 shrink-0" />
            <span>Your new password must be different from your current password.</span>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={mutation.isPending}
              className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-navy-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs transition-colors shadow-xs disabled:opacity-50"
            >
              {mutation.isPending ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};
