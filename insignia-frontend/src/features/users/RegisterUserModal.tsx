import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { RegisterUserDto } from '@/types';
import { registerUserApi } from '@/services/api/endpoints';
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
  Lock,
  Eye,
  EyeOff,
  UserPlus,
  CheckCircle2,
} from 'lucide-react';

interface RegisterUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const RegisterUserModal: React.FC<RegisterUserModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const queryClient = useQueryClient();

  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const resetForm = () => {
    setUsername('');
    setFullName('');
    setEmail('');
    setPhone('');
    setDateOfBirth('');
    setAddress('');
    setPassword('');
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleClose = () => {
    if (!mutation.isPending) {
      resetForm();
      onClose();
    }
  };

  const mutation = useMutation({
    mutationFn: (data: RegisterUserDto) => registerUserApi(data),
    onSuccess: () => {
      const createdUsername = username.trim();
      setSuccessMessage(`User @${createdUsername} registered successfully!`);
      showSuccessAlert(
        'User Registered Successfully!',
        `User @${createdUsername} has been registered and their wallet initialized.`
      );

      // Invalidate relevant user queries
      queryClient.invalidateQueries({ queryKey: ['admin_users'] });
      queryClient.invalidateQueries({ queryKey: ['admin_users_all'] });
      queryClient.invalidateQueries({ queryKey: ['admin_users_stats'] });
      queryClient.invalidateQueries({ queryKey: ['balance'] });

      onSuccess?.();

      setTimeout(() => {
        handleClose();
      }, 1200);
    },
    onError: (err) => {
      const normalized = normalizeApiError(err);
      setErrorMessage(normalized.message);
      showErrorAlert('Registration Failed', normalized.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanUsername = username.trim();
    if (!cleanUsername) {
      setErrorMessage('Username is required.');
      return;
    }

    mutation.mutate({
      username: cleanUsername,
      fullName: fullName.trim() || undefined,
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      dateOfBirth: dateOfBirth.trim() || undefined,
      address: address.trim() || undefined,
      password: password.trim() || undefined,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Register New User"
      description="Create a new user profile and initialize their Insignia cryptocurrency wallet."
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
        {/* Row 1: Username & Full Name */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Username *"
            type="text"
            placeholder="e.g. johndoe"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
            leftIcon={<User className="w-4 h-4" />}
            required
            disabled={mutation.isPending}
          />

          <Input
            label="Full Name"
            type="text"
            placeholder="e.g. John Doe"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            disabled={mutation.isPending}
          />
        </div>

        {/* Row 2: Email Address */}
        <Input
          label="Email Address"
          type="email"
          placeholder="e.g. john.doe@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          leftIcon={<Mail className="w-4 h-4" />}
          disabled={mutation.isPending}
        />

        {/* Row 3: Phone & Date of Birth */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Phone Number"
            type="tel"
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

        {/* Row 4: Address */}
        <Input
          label="Residential Address"
          type="text"
          placeholder="e.g. South Jakarta, Indonesia"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          leftIcon={<MapPin className="w-4 h-4" />}
          disabled={mutation.isPending}
        />

        {/* Row 5: Password (Optional initial password) */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-navy-700 mb-1.5">
            Initial Password (Optional)
          </label>
          <div className="relative flex items-center">
            <div className="absolute left-3 flex items-center pointer-events-none text-slate-400">
              <Lock className="w-4 h-4" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Leave blank or enter secure password"
              disabled={mutation.isPending}
              className="w-full bg-white text-navy-900 border border-slate-300 rounded-lg pl-10 pr-10 py-2 text-sm focus-ring"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 text-slate-400 hover:text-navy-900"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            If left blank, user can set password later via profile settings.
          </p>
        </div>

        {/* Modal Footer */}
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
            isLoading={mutation.isPending}
            disabled={mutation.isPending}
          >
            <UserPlus className="w-4 h-4 mr-1.5" />
            Register User
          </Button>
        </div>
      </form>
    </Modal>
  );
};
