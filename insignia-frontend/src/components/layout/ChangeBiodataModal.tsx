import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { getAdminProfileApi, updateAdminProfileApi } from '@/services/api/endpoints';
import { normalizeApiError } from '@/services/api/client';
import { User, Mail, Phone, Calendar, MapPin, CheckCircle2 } from 'lucide-react';

interface ChangeBiodataModalProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
}

export const ChangeBiodataModal: React.FC<ChangeBiodataModalProps> = ({
  isOpen,
  onClose,
  username,
}) => {
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['admin_profile', username],
    queryFn: () => getAdminProfileApi(username),
    enabled: isOpen && Boolean(username),
  });

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [address, setAddress] = useState('');

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName || '');
      setEmail(profile.email || '');
      setPhone(profile.phone || '');
      setDateOfBirth(profile.dateOfBirth || '');
      setAddress(profile.address || '');
    }
  }, [profile]);

  const mutation = useMutation({
    mutationFn: (data: any) => updateAdminProfileApi(username, data),
    onSuccess: () => {
      setSuccessMessage('Biodata updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['admin_profile', username] });
      queryClient.invalidateQueries({ queryKey: ['admin_user_details', username] });
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
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Change Biodata"
      description={`Update personal details for @${username}`}
      size="md"
    >
      {isLoading ? (
        <div className="py-8 flex flex-col items-center justify-center">
          <div className="w-7 h-7 border-3 border-brand-600 border-t-transparent rounded-full animate-spin mb-2" />
          <p className="text-xs text-slate-400">Loading profile...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMessage && (
            <Alert variant="error" title="Failed to Update Biodata">
              {errorMessage}
            </Alert>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Full Name
            </label>
            <div className="relative">
              <Input
                type="text"
                placeholder="e.g. Administrator"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="pl-9"
              />
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Input
                type="email"
                placeholder="e.g. admin@insignia.wallet"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-9"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Phone */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Phone Number
              </label>
              <div className="relative">
                <Input
                  type="text"
                  placeholder="+62 812 3456 7890"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="pl-9"
                />
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Date of Birth */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Date of Birth
              </label>
              <div className="relative">
                <Input
                  type="text"
                  placeholder="15 May 1996"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="pl-9"
                />
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Address
            </label>
            <div className="relative">
              <Input
                type="text"
                placeholder="South Jakarta, Indonesia"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="pl-9"
              />
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={mutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={mutation.isPending}
              className="bg-brand-600 hover:bg-brand-700 text-white"
            >
              Save Changes
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};
