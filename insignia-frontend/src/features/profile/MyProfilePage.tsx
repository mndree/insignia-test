import React, { useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/useAuth';
import { getAdminProfileApi, getBalanceApi } from '@/services/api/endpoints';
import { Header } from '@/components/layout/Header';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { ChangeBiodataModal } from '@/components/layout/ChangeBiodataModal';
import { ChangePasswordModal } from '@/components/layout/ChangePasswordModal';
import { TransferModal } from '@/features/overview/TransferModal';
import { formatWalletUnits, formatShortDate } from '@/utils/formatters';
import {
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Wallet,
  ShieldCheck,
  KeyRound,
  UserPen,
  ArrowRight,
  Clock,
  IdCard,
  Send,
  CheckCircle2,
} from 'lucide-react';

export const MyProfilePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const outletContext = useOutletContext<{ onOpenSidebar?: () => void }>() || {};
  const onOpenSidebar = outletContext.onOpenSidebar || (() => {});

  const [isEditBiodataOpen, setIsEditBiodataOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  const username = user?.username || '';
  const isUserRole = user?.role === 'USER';

  // Fetch full user profile
  const {
    data: profile,
    isLoading: isProfileLoading,
    error: profileError,
    refetch: refetchProfile,
  } = useQuery({
    queryKey: ['admin_profile', username],
    queryFn: () => getAdminProfileApi(username),
    enabled: Boolean(username),
    staleTime: 1000 * 60,
  });

  // Fetch live wallet balance
  const {
    data: balanceData,
    isLoading: isBalanceLoading,
  } = useQuery({
    queryKey: ['wallet_balance'],
    queryFn: getBalanceApi,
    staleTime: 1000 * 30,
  });

  const isLoading = isProfileLoading || isBalanceLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Header
          onOpenSidebar={onOpenSidebar}
          title="My Profile"
          description="Manage your wallet identity, personal details, and account security"
        />
        <div className="flex items-center justify-center min-h-[350px]">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  const currentBalance = balanceData?.balance ?? profile?.balance ?? 0;

  return (
    <div className="space-y-6">
      <Header
        onOpenSidebar={onOpenSidebar}
        title="My Profile"
        description="Manage your wallet identity, personal details, and account security"
        actions={
          <div className="flex items-center gap-2.5">
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsEditBiodataOpen(true)}
              className="bg-brand-600 hover:bg-brand-700 text-white font-semibold shadow-xs flex items-center gap-1.5"
            >
              <UserPen className="w-4 h-4" />
              <span>Edit Biodata</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsChangePasswordOpen(true)}
              className="bg-white hover:bg-slate-50 border-slate-200/90 text-navy-800 font-semibold flex items-center gap-1.5"
            >
              <KeyRound className="w-4 h-4" />
              <span>Change Password</span>
            </Button>
          </div>
        }
      />

      {profileError && (
        <Alert variant="error">
          Failed to load profile details. Please try refreshing.
        </Alert>
      )}

      {/* Hero Identity Card */}
      <Card className="border-slate-200/90 shadow-sm overflow-hidden bg-gradient-to-r from-slate-50/70 via-white to-indigo-50/40">
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-2xl bg-brand-600 text-white font-extrabold text-2xl flex items-center justify-center shadow-md select-none shrink-0">
                {profile?.fullName
                  ? profile.fullName.slice(0, 2).toUpperCase()
                  : username.slice(0, 2).toUpperCase()}
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h2 className="text-xl sm:text-2xl font-bold text-navy-900 tracking-tight">
                    {profile?.fullName || username}
                  </h2>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/70">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    {profile?.status || 'Active'}
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/70">
                    {isUserRole ? 'Wallet Member' : 'Administrator'}
                  </span>
                </div>
                <p className="text-sm text-slate-500 font-medium">@{username}</p>
                {profile?.userCode && (
                  <p className="text-xs font-mono text-slate-400">
                    ID: {profile.userCode}
                  </p>
                )}
              </div>
            </div>

            {/* Quick Wallet Balance Pill */}
            <div className="bg-white px-5 py-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-center min-w-[200px]">
              <span className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5 text-brand-600" />
                Available Wallet Balance
              </span>
              <span className="text-2xl font-extrabold text-navy-900 mt-1">
                {formatWalletUnits(currentBalance)}
              </span>
              <div className="mt-2.5 flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => setIsTransferModalOpen(true)}
                  className="w-full text-xs py-1 h-8 bg-brand-600 hover:bg-brand-700 text-white font-medium flex items-center justify-center gap-1"
                >
                  <Send className="w-3 h-3" />
                  <span>Transfer</span>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Personal Biodata Column (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-slate-200/90 shadow-sm">
            <CardHeader className="border-b border-slate-100 pb-4">
              <CardTitle className="text-base font-bold text-navy-900 flex items-center gap-2">
                <IdCard className="w-4 h-4 text-brand-600" />
                Personal Information
              </CardTitle>
              <CardDescription>
                Verified account biodata linked to your Insignia cryptocurrency wallet.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5 text-sm">
                <div>
                  <dt className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Full Name
                  </dt>
                  <dd className="mt-1 text-sm font-semibold text-navy-900 flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-400" />
                    {profile?.fullName || 'Not provided'}
                  </dd>
                </div>

                <div>
                  <dt className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Username
                  </dt>
                  <dd className="mt-1 text-sm font-semibold text-navy-900">
                    @{username}
                  </dd>
                </div>

                <div>
                  <dt className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Email Address
                  </dt>
                  <dd className="mt-1 text-sm font-semibold text-navy-900 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-slate-400" />
                    {profile?.email || `${username}@example.com`}
                  </dd>
                </div>

                <div>
                  <dt className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Phone Number
                  </dt>
                  <dd className="mt-1 text-sm font-semibold text-navy-900 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-400" />
                    {profile?.phone || 'Not provided'}
                  </dd>
                </div>

                <div>
                  <dt className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Date of Birth
                  </dt>
                  <dd className="mt-1 text-sm font-semibold text-navy-900 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    {profile?.dateOfBirth || 'Not provided'}
                  </dd>
                </div>

                <div>
                  <dt className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Residential Address
                  </dt>
                  <dd className="mt-1 text-sm font-semibold text-navy-900 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    {profile?.address || 'Not provided'}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </div>

        {/* Account & Security Summary Column (1 col) */}
        <div className="space-y-6">
          <Card className="border-slate-200/90 shadow-sm">
            <CardHeader className="border-b border-slate-100 pb-4">
              <CardTitle className="text-base font-bold text-navy-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Security & Authentication
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div>
                <p className="text-xs text-slate-500 font-medium">Password Security</p>
                <p className="text-sm font-semibold text-navy-900 mt-0.5">
                  ••••••••••••
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Protected with salted bcrypt hashing algorithm.
                </p>
              </div>

              <div className="pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsChangePasswordOpen(true)}
                  className="w-full text-xs justify-center"
                >
                  <KeyRound className="w-3.5 h-3.5 mr-1.5" />
                  Update Password
                </Button>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Clock className="w-3.5 h-3.5" />
                  <span>
                    Member since {profile?.createdAt ? formatShortDate(profile.createdAt) : '2026'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200/90 shadow-sm bg-gradient-to-br from-brand-50/50 to-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-navy-900">
                    Wallet Transactions
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    View incoming and outgoing transfers
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/transactions')}
                  className="text-xs bg-white hover:bg-slate-50 font-semibold"
                >
                  <span>View All</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Biodata Modal */}
      <ChangeBiodataModal
        isOpen={isEditBiodataOpen}
        onClose={() => {
          setIsEditBiodataOpen(false);
          refetchProfile();
        }}
        username={username}
      />

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
        username={username}
      />

      {/* Transfer Modal */}
      <TransferModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        currentBalance={currentBalance}
      />
    </div>
  );
};
