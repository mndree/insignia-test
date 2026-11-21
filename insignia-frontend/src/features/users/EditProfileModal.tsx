import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { UserDetailsResponseDto, UpdateUserProfileDto } from '@/types';
import { updateUserProfileApi } from '@/services/api/endpoints';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { DatePickerInput } from '@/components/ui/DatePickerInput';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { normalizeApiError } from '@/services/api/client';
import { showSuccessAlert, showErrorAlert } from '@/utils/sweetalert';
import { formatPhoneNumber } from '@/utils/masking';
import {
  User,
  Mail,
  Phone,
  MapPin,
  CheckCircle2,
  IdCard,
  Wallet,
  Lock,
  Eye,
  EyeOff,
} from 'lucide-react';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserDetailsResponseDto;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  user,
}) => {
  const queryClient = useQueryClient();

  // All fields matching public.users table schema
  const [userCode, setUserCode] = useState(user.userCode || '');
  const [username, setUsername] = useState(user.username || '');
  const [fullName, setFullName] = useState(user.fullName || '');
  const [email, setEmail] = useState(user.email || '');
  const [phone, setPhone] = useState(formatPhoneNumber(user.phone || ''));
  const [dateOfBirth, setDateOfBirth] = useState(user.dateOfBirth || '');
  const [address, setAddress] = useState(user.address || '');
  const [balance, setBalance] = useState<string>(user.balance !== undefined ? user.balance.toString() : '0');
  const [status, setStatus] = useState<'Active' | 'Inactive'>(user.status || 'Active');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (data: UpdateUserProfileDto) =>
      updateUserProfileApi(user.id, data),
    onSuccess: () => {
      setSuccessMessage('User profile updated successfully!');
      showSuccessAlert('Profile Updated', 'User profile updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['admin_user_details', user.id] });
      queryClient.invalidateQueries({ queryKey: ['admin_user_details', user.username] });
      queryClient.invalidateQueries({ queryKey: ['admin_users'] });
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 1200);
    },
    onError: (err) => {
      const normalized = normalizeApiError(err);
      setErrorMessage(normalized.message);
      showErrorAlert('Update Failed', normalized.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    mutation.mutate({
      userCode: userCode.trim() || undefined,
      username: username.trim() || undefined,
      fullName: fullName.trim() || undefined,
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      dateOfBirth: dateOfBirth.trim() || undefined,
      address: address.trim() || undefined,
      balance: balance ? Number(balance) : undefined,
      status,
      password: password.trim() || undefined,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit User Profile"
      description={`Update complete database records and active status for @${user.username}`}
      size="lg"
    >
      {errorMessage && (
        <Alert variant="error" className="mb-4" onClose={() => setErrorMessage(null)}>
          {errorMessage}
        </Alert>
      )}

      {successMessage && (
        <Alert variant="success" className="mb-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto px-1 py-1">
        {/* Row 1: User Code & Username */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="User Code"
            type="text"
            placeholder="e.g. USR-0001"
            value={userCode}
            onChange={(e) => setUserCode(e.target.value)}
            leftIcon={<IdCard className="w-4 h-4" />}
            disabled={mutation.isPending}
          />

          <Input
            label="Username"
            type="text"
            placeholder="e.g. andre"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            leftIcon={<User className="w-4 h-4" />}
            disabled={mutation.isPending}
            required
          />
        </div>

        {/* Row 2: Full Name */}
        <Input
          label="Full Name"
          type="text"
          placeholder="e.g. Andre Juliansyah"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          leftIcon={<User className="w-4 h-4" />}
          disabled={mutation.isPending}
        />

        {/* Row 3: Email Address */}
        <Input
          label="Email Address"
          type="email"
          placeholder="e.g. andre@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          leftIcon={<Mail className="w-4 h-4" />}
          disabled={mutation.isPending}
        />

        {/* Row 4: Phone & Date of Birth */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Phone"
            type="text"
            placeholder="+62 812 3456 7890"
            value={phone}
            onChange={(e) => setPhone(formatPhoneNumber(e.target.value))}
            leftIcon={<Phone className="w-4 h-4" />}
            disabled={mutation.isPending}
          />

          <DatePickerInput
            label="Date of Birth"
            value={dateOfBirth}
            onChange={setDateOfBirth}
            placeholder="15 May 1996"
            disabled={mutation.isPending}
          />
        </div>

        {/* Row 5: Address */}
        <Input
          label="Residential Address"
          type="text"
          placeholder="e.g. South Jakarta, Indonesia"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          leftIcon={<MapPin className="w-4 h-4" />}
          disabled={mutation.isPending}
        />

        {/* Row 6: Wallet Balance & Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Wallet Balance"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={balance}
            onChange={(e) => setBalance(e.target.value)}
            leftIcon={<Wallet className="w-4 h-4" />}
            disabled={mutation.isPending}
          />

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-navy-700 mb-1.5">
              Account Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as 'Active' | 'Inactive')}
              disabled={mutation.isPending}
              className="w-full bg-white text-navy-900 border border-slate-300 rounded-lg px-3 py-2 text-sm focus-ring"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Row 7: Reset Password (Optional) */}
        <div>
          <Input
            label="Reset User Password (Optional)"
            type={showPassword ? 'text' : 'password'}
            placeholder="Leave blank to keep unchanged"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leftIcon={<Lock className="w-4 h-4" />}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-slate-400 hover:text-navy-700 transition-colors focus-ring rounded p-1"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
            disabled={mutation.isPending}
          />
          <p className="text-[11px] text-slate-400 mt-1">
            Setting a new password will re-hash and update the user's login credentials.
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
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
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
};
