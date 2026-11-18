import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { UserDetailsResponseDto, UpdateUserProfileDto } from '@/types';
import { updateUserProfileApi } from '@/services/api/endpoints';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { normalizeApiError } from '@/services/api/client';
import { User, Mail, Phone, Calendar, MapPin, CheckCircle2 } from 'lucide-react';

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

  const [fullName, setFullName] = useState(user.fullName || '');
  const [email, setEmail] = useState(user.email || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [dateOfBirth, setDateOfBirth] = useState(user.dateOfBirth || '');
  const [address, setAddress] = useState(user.address || '');
  const [status, setStatus] = useState<'Active' | 'Inactive'>(user.status || 'Active');

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (data: UpdateUserProfileDto) =>
      updateUserProfileApi(user.id, data),
    onSuccess: () => {
      setSuccessMessage('Profile updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['admin_user_details', user.id] });
      queryClient.invalidateQueries({ queryKey: ['admin_user_details', user.username] });
      queryClient.invalidateQueries({ queryKey: ['admin_users'] });
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 1200);
    },
    onError: (err) => {
      setErrorMessage(normalizeApiError(err).message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    mutation.mutate({
      fullName: fullName.trim() || undefined,
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      dateOfBirth: dateOfBirth.trim() || undefined,
      address: address.trim() || undefined,
      status,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit User Profile"
      description={`Update biodata and active status for @${user.username}`}
      size="md"
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

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Full Name"
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          leftIcon={<User className="w-4 h-4" />}
          disabled={mutation.isPending}
        />

        <Input
          label="Email Address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          leftIcon={<Mail className="w-4 h-4" />}
          disabled={mutation.isPending}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Phone"
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            leftIcon={<Phone className="w-4 h-4" />}
            disabled={mutation.isPending}
          />

          <Input
            label="Date of Birth"
            type="text"
            value={dateOfBirth}
            onChange={(e) => setDateOfBirth(e.target.value)}
            leftIcon={<Calendar className="w-4 h-4" />}
            disabled={mutation.isPending}
          />
        </div>

        <Input
          label="Address"
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          leftIcon={<MapPin className="w-4 h-4" />}
          disabled={mutation.isPending}
        />

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-navy-700 mb-1.5">
            Status
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
