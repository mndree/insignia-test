import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { DatePickerInput } from '@/components/ui/DatePickerInput';
import { Alert } from '@/components/ui/Alert';
import { getAdminProfileApi, updateAdminProfileApi } from '@/services/api/endpoints';
import { normalizeApiError } from '@/services/api/client';
import { formatPhoneNumber } from '@/utils/masking';
import { showSuccessAlert, showErrorAlert } from '@/utils/sweetalert';
import { ChevronDown, CheckCircle2 } from 'lucide-react';

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['admin_profile', username],
    queryFn: () => getAdminProfileApi(username),
    enabled: isOpen && Boolean(username),
  });

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('Male');
  const [address, setAddress] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName || 'Andre Juliansyah');
      setEmail(profile.email || 'andre@example.com');
      setPhone(formatPhoneNumber(profile.phone || '+62 812 3456 7890'));
      setDateOfBirth(profile.dateOfBirth || '15 May 1996');
      setGender((profile as any).gender || 'Male');
      setAddress(profile.address || 'Jakarta, Indonesia');
      setAvatarUrl((profile as any).avatarUrl || null);
    }
  }, [profile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      const msg = 'Photo file size must be less than 5MB.';
      setErrorMessage(msg);
      showErrorAlert('File Too Large', msg);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.88);
          setAvatarUrl(compressed);
        } else {
          setAvatarUrl(event.target?.result as string);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const mutation = useMutation({
    mutationFn: (data: any) => updateAdminProfileApi(username, data),
    onSuccess: () => {
      setSuccessMessage('Biodata updated successfully!');
      showSuccessAlert('Biodata Updated', 'Your personal information has been saved successfully.');
      queryClient.invalidateQueries({ queryKey: ['admin_profile'] });
      queryClient.invalidateQueries({ queryKey: ['admin_user_details'] });
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
      fullName: fullName.trim() || undefined,
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      dateOfBirth: dateOfBirth.trim() || undefined,
      gender: gender || 'Male',
      address: address.trim() || undefined,
      avatarUrl: avatarUrl !== null && avatarUrl !== undefined ? avatarUrl : '',
    });
  };

  const getInitials = () => {
    if (fullName) {
      const parts = fullName.trim().split(/\s+/);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return parts[0].slice(0, 2).toUpperCase();
    }
    return username.slice(0, 2).toUpperCase();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Update Biodata"
      description="Update your personal information."
      size="md"
    >
      {isLoading ? (
        <div className="py-10 flex flex-col items-center justify-center">
          <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs text-slate-500 font-medium">Loading biodata...</p>
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

          {/* Avatar and Change Photo */}
          <div className="flex items-center gap-3 pb-1">
            <div className="w-14 h-14 rounded-2xl bg-indigo-100 border border-indigo-200/80 flex items-center justify-center text-brand-700 font-bold text-lg select-none shrink-0 shadow-2xs overflow-hidden">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Avatar Preview"
                  className="w-full h-full object-cover rounded-2xl"
                />
              ) : (
                getInitials()
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={handleFileChange}
              className="hidden"
            />

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-navy-800 transition-colors shadow-2xs cursor-pointer"
              >
                Change Photo
              </button>

              {avatarUrl && (
                <button
                  type="button"
                  onClick={() => setAvatarUrl(null)}
                  className="text-xs font-medium text-slate-400 hover:text-rose-600 transition-colors px-2 py-1"
                >
                  Remove
                </button>
              )}
            </div>
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-navy-900 mb-1.5">
              Full Name
            </label>
            <Input
              type="text"
              placeholder="e.g. Andre Juliansyah"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          {/* Username & Email Address */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-navy-900 mb-1.5">
                Username
              </label>
              <Input
                type="text"
                value={username}
                disabled
                className="bg-slate-50 text-slate-500 font-mono text-xs cursor-not-allowed select-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-navy-900 mb-1.5">
                Email Address
              </label>
              <Input
                type="email"
                placeholder="e.g. andre@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Phone Number & Date of Birth */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-navy-900 mb-1.5">
                Phone Number
              </label>
              <Input
                type="text"
                placeholder="+62 812 3456 7890"
                value={phone}
                onChange={(e) => setPhone(formatPhoneNumber(e.target.value))}
              />
            </div>
            <div>
              <DatePickerInput
                label="Date of Birth"
                value={dateOfBirth}
                onChange={setDateOfBirth}
                placeholder="15 May 1996"
              />
            </div>
          </div>

          {/* Gender */}
          <div>
            <label className="block text-xs font-semibold text-navy-900 mb-1.5">
              Gender
            </label>
            <div className="relative">
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium text-navy-900 bg-white focus-ring appearance-none pr-10"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-xs font-semibold text-navy-900 mb-1.5">
              Address
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Jakarta, Indonesia"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium text-navy-900 bg-white focus-ring resize-y"
            />
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
              {mutation.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};
