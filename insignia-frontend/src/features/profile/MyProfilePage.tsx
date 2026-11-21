import React, { useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/useAuth';
import { getAdminProfileApi, getBalanceApi } from '@/services/api/endpoints';
import { Header } from '@/components/layout/Header';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { ChangeBiodataModal } from '@/components/layout/ChangeBiodataModal';
import { ChangePasswordModal } from '@/components/layout/ChangePasswordModal';
import { TransferModal } from '@/features/overview/TransferModal';
import { formatWalletUnits, formatShortDate } from '@/utils/formatters';
import {
  User,
  Users,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Wallet,
  ShieldCheck,
  Lock,
  UserPen,
  PenLine,
  ArrowRight,
  Clock,
  Send,
  CheckCircle2,
  ArrowLeftRight,
  FileText,
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
      {/* Page Title & Top Actions */}
      <Header
        onOpenSidebar={onOpenSidebar}
        title="My Profile"
        description="Manage your wallet identity, personal details, and account security"
        actions={
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsEditBiodataOpen(true)}
              className="bg-white hover:bg-slate-50 border border-slate-200/90 text-navy-900 font-semibold text-xs sm:text-sm px-4 py-2 rounded-xl sm:rounded-full shadow-2xs flex items-center gap-2 transition-colors cursor-pointer"
            >
              <UserPen className="w-4 h-4 text-brand-600" />
              <span>Edit Biodata</span>
            </button>
            <button
              onClick={() => setIsChangePasswordOpen(true)}
              className="bg-white hover:bg-slate-50 border border-slate-200/90 text-navy-900 font-semibold text-xs sm:text-sm px-4 py-2 rounded-xl sm:rounded-full shadow-2xs flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Lock className="w-4 h-4 text-slate-500" />
              <span>Change Password</span>
            </button>
          </div>
        }
      />

      {profileError && (
        <Alert variant="error">
          Failed to load profile details. Please try refreshing.
        </Alert>
      )}

      {/* Top Hero Section: Gradient Profile Banner + Wallet Balance */}
      <div className="bg-white rounded-3xl border border-slate-100 p-2 sm:p-2.5 shadow-xs flex flex-col lg:flex-row gap-3 items-stretch">
        {/* Left: Lavender/Indigo Gradient Hero Banner */}
        <div className="flex-1 rounded-2xl relative overflow-hidden bg-gradient-to-r from-[#595cf6] via-[#8c94fc] to-[#ccd2fe] p-5 sm:p-6 flex items-center justify-between min-h-[120px]">
          {/* Subtle Sparkle Stars */}
          <div className="absolute top-4 left-[58%] text-white/70 text-sm select-none pointer-events-none">
            ✦
          </div>
          <div className="absolute bottom-4 left-[42%] text-white/60 text-xs select-none pointer-events-none">
            ✦
          </div>

          {/* User Info (Avatar + Details) */}
          <div className="flex items-center gap-4 sm:gap-5 relative z-10">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#3730a3] text-white font-extrabold text-2xl flex items-center justify-center shadow-md select-none shrink-0 overflow-hidden border-2 border-white/20">
              {profile?.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={profile?.fullName || username}
                  className="w-full h-full object-cover"
                />
              ) : profile?.fullName ? (
                profile.fullName.slice(0, 2).toUpperCase()
              ) : (
                username.slice(0, 2).toUpperCase()
              )}
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                  {profile?.fullName || username}
                </h2>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white text-emerald-700 shadow-2xs border border-emerald-100">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  {profile?.status || 'Active'}
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-white/80 text-indigo-900 shadow-2xs">
                  {isUserRole ? 'Wallet Member' : 'Administrator'}
                </span>
              </div>
              <p className="text-sm text-slate-700 font-semibold">@{username}</p>
            </div>
          </div>

          {/* Right: 3D Crypto Insignia Coin Illustration */}
          <div className="hidden sm:block absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 pointer-events-none opacity-85 select-none">
            <svg
              className="w-36 h-36 sm:w-44 sm:h-44"
              viewBox="0 0 200 200"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Outer Glow */}
              <circle cx="100" cy="100" r="75" fill="url(#coin_glow)" opacity="0.4" />
              {/* Coin Shadow */}
              <ellipse cx="100" cy="115" rx="60" ry="50" fill="#4338ca" opacity="0.35" />
              {/* Coin 3D Rim */}
              <ellipse cx="100" cy="100" rx="58" ry="48" fill="#818cf8" />
              <ellipse cx="100" cy="97" rx="58" ry="48" fill="#a5b4fc" />
              <ellipse cx="100" cy="94" rx="56" ry="46" fill="#c7d2fe" />
              {/* Coin Face */}
              <ellipse cx="100" cy="92" rx="53" ry="43" fill="url(#coin_face)" />
              {/* Coin Inner Bevel */}
              <ellipse
                cx="100"
                cy="92"
                rx="46"
                ry="37"
                fill="none"
                stroke="#c7d2fe"
                strokeWidth="2.5"
                opacity="0.8"
              />
              {/* Insignia 'S' Logo on Coin */}
              <g transform="translate(76, 70) scale(0.95)">
                <path
                  d="M26 6 L44 16 L44 32 L26 42 L8 32 L8 16 Z"
                  fill="#ffffff"
                  opacity="0.3"
                />
                <path
                  d="M17 17 C17 14, 33 13, 34 18 C35 22, 16 23, 17 30 C18 36, 35 34, 34 31"
                  stroke="#ffffff"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </g>
              <defs>
                <radialGradient id="coin_glow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#c7d2fe" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#818cf8" stopOpacity="0" />
                </radialGradient>
                <linearGradient id="coin_face" x1="50" y1="50" x2="150" y2="140">
                  <stop offset="0%" stopColor="#e0e7ff" />
                  <stop offset="100%" stopColor="#a5b4fc" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        {/* Right: Available Wallet Balance Box */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 flex flex-col justify-between min-w-[240px] lg:w-72 border border-slate-100 shadow-2xs">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
              <Wallet className="w-4 h-4 text-slate-400" />
              <span>Available Wallet Balance</span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-navy-900 my-2">
              {formatWalletUnits(currentBalance)}
            </div>
          </div>

          <button
            onClick={() => setIsTransferModalOpen(true)}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold text-xs sm:text-sm shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer mt-2"
          >
            <Send className="w-3.5 h-3.5 rotate-45" />
            <span>Transfer</span>
          </button>
        </div>
      </div>

      {/* Middle Row: Personal Information + Security & Authentication */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Personal Information (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-100/90 shadow-xs p-6 sm:p-7 flex flex-col justify-between">
          <div>
            {/* Card Header */}
            <div className="flex items-center justify-between pb-6 border-b border-slate-100/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-navy-900">
                    Personal Information
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Verified account biodata linked to your Insignia cryptocurrency wallet.
                  </p>
                </div>
              </div>

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60 shadow-2xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Verified
              </span>
            </div>

            {/* Biodata Grid 2-columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 pt-6">
              {/* Full Name */}
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-full bg-indigo-50/80 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    FULL NAME
                  </span>
                  <span className="block text-sm font-extrabold text-navy-900 mt-0.5">
                    {profile?.fullName || 'Not provided'}
                  </span>
                </div>
              </div>

              {/* Username */}
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-full bg-indigo-50/80 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    USERNAME
                  </span>
                  <span className="block text-sm font-extrabold text-navy-900 mt-0.5">
                    @{username}
                  </span>
                </div>
              </div>

              {/* Email Address */}
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-full bg-indigo-50/80 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Mail className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    EMAIL ADDRESS
                  </span>
                  <span className="block text-sm font-extrabold text-navy-900 mt-0.5 truncate">
                    {profile?.email || `${username}@example.com`}
                  </span>
                </div>
              </div>

              {/* Phone Number */}
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-full bg-indigo-50/80 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    PHONE NUMBER
                  </span>
                  <span className="block text-sm font-extrabold text-navy-900 mt-0.5">
                    {profile?.phone || 'Not provided'}
                  </span>
                </div>
              </div>

              {/* Date of Birth */}
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-full bg-indigo-50/80 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    DATE OF BIRTH
                  </span>
                  <span className="block text-sm font-extrabold text-navy-900 mt-0.5">
                    {profile?.dateOfBirth || 'Not provided'}
                  </span>
                </div>
              </div>

              {/* Residential Address */}
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-full bg-indigo-50/80 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    RESIDENTIAL ADDRESS
                  </span>
                  <span className="block text-xs sm:text-sm font-extrabold text-navy-900 mt-0.5 leading-snug">
                    {profile?.address || 'Not provided'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Security & Authentication (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-100/90 shadow-xs p-6 sm:p-7 flex flex-col justify-between space-y-5">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-navy-900">
                Security & Authentication
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Your account security is our priority.
              </p>
            </div>
          </div>

          {/* Inner Security Card */}
          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-100/80 text-indigo-600 flex items-center justify-center shrink-0 shadow-2xs">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <span className="block text-xs font-bold text-navy-900">
                  Password Security
                </span>
                <span className="block text-sm font-extrabold tracking-widest text-navy-900 my-0.5">
                  ••••••••
                </span>
                <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Protected with strong encryption
                </span>
              </div>
            </div>

            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 shadow-2xs">
              Strong
            </span>
          </div>

          {/* Update Password Action Button */}
          <button
            onClick={() => setIsChangePasswordOpen(true)}
            className="w-full py-2.5 px-4 rounded-xl border border-indigo-500 hover:bg-indigo-50/60 text-indigo-600 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-2xs cursor-pointer"
          >
            <PenLine className="w-4 h-4" />
            <span>Update Password</span>
          </button>

          {/* Member since footer */}
          <div className="flex items-center gap-2 text-xs text-slate-400 font-medium pt-1">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>
              Member since {profile?.createdAt ? formatShortDate(profile.createdAt).slice(-4) : '2026'}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Row: Wallet Transactions + Promotional Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Wallet Transactions (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-100/90 shadow-xs p-6 sm:p-7 relative overflow-hidden flex flex-col justify-between min-h-[180px]">
          {/* Header */}
          <div className="flex items-center justify-between pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <ArrowLeftRight className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-navy-900">
                  Wallet Transactions
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  View incoming and outgoing transactions
                </p>
              </div>
            </div>

            <button
              onClick={() => navigate('/transactions')}
              className="px-4 py-1.5 rounded-full border border-slate-200 hover:bg-slate-50 text-navy-900 font-semibold text-xs flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Empty State */}
          <div className="py-6 flex items-center justify-center gap-3 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-indigo-50/80 text-indigo-500 flex items-center justify-center shadow-2xs shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-extrabold text-navy-900">
                No transactions yet
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Your transactions will appear here once you start using your wallet.
              </p>
            </div>
          </div>

          {/* Subtle Bottom Curve Decoration */}
          <svg
            className="absolute bottom-0 left-0 right-0 w-full h-8 text-indigo-50/40 pointer-events-none"
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
          >
            <path
              d="M0,40 C150,90 350,10 500,60 C650,110 900,20 1200,50 L1200,120 L0,120 Z"
              fill="currentColor"
            />
          </svg>
        </div>

        {/* Right Column: Start Using Your Wallet Promo Card (4 cols) */}
        <div className="lg:col-span-4 rounded-3xl bg-gradient-to-r from-[#4f46e5] via-[#6366f1] to-[#7c3aed] p-6 text-white relative overflow-hidden flex flex-col justify-between min-h-[180px] shadow-sm">
          {/* Text & Button */}
          <div className="relative z-10 max-w-[62%] space-y-1">
            <h3 className="text-base sm:text-lg font-extrabold text-white leading-tight">
              Start using your wallet
            </h3>
            <p className="text-xs text-indigo-100/90 mt-1 leading-relaxed">
              Send, receive, and manage your crypto assets with ease.
            </p>
            <div className="pt-3">
              <button
                onClick={() => navigate('/transactions')}
                className="px-4 py-2 rounded-full bg-white hover:bg-indigo-50 text-indigo-700 font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <span>Explore Features</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* 3D Crypto Wallet & Floating Coins Vector Illustration */}
          <div className="absolute -right-3 -bottom-2 w-44 h-44 pointer-events-none select-none z-0">
            <svg
              viewBox="0 0 200 200"
              className="w-full h-full"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Floating Bitcoin Coin (Gold) */}
              <g transform="translate(42, 18) scale(0.95)">
                <circle cx="20" cy="20" r="18" fill="url(#btc_grad)" />
                <circle cx="20" cy="20" r="15" fill="#f59e0b" />
                <text
                  x="20"
                  y="26"
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="17"
                  fontWeight="bold"
                  fontFamily="sans-serif"
                >
                  ₿
                </text>
                <circle cx="28" cy="12" r="2.5" fill="#ffffff" opacity="0.8" />
              </g>

              {/* Floating Ethereum Diamond (Blue/Indigo) */}
              <g transform="translate(110, 32) scale(0.9)">
                <circle cx="20" cy="20" r="16" fill="url(#eth_glow)" />
                <polygon points="20,7 29,20 20,25 11,20" fill="#c7d2fe" />
                <polygon points="20,27 29,22 20,33 11,22" fill="#818cf8" />
                <polygon points="20,7 20,25 11,20" fill="#e0e7ff" />
                <polygon points="20,27 20,33 11,22" fill="#6366f1" />
              </g>

              {/* Floating Tether Coin (Emerald) */}
              <g transform="translate(150, 75) scale(0.85)">
                <circle cx="16" cy="16" r="15" fill="url(#usdt_grad)" />
                <text
                  x="16"
                  y="22"
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="15"
                  fontWeight="bold"
                  fontFamily="sans-serif"
                >
                  ₮
                </text>
              </g>

              {/* 3D Purple Wallet */}
              <g transform="translate(30, 80)">
                {/* Wallet Shadow */}
                <ellipse cx="80" cy="95" rx="65" ry="12" fill="#1e1b4b" opacity="0.4" />
                {/* Wallet Back Layer */}
                <rect
                  x="20"
                  y="15"
                  width="115"
                  height="72"
                  rx="14"
                  fill="#3730a3"
                />
                {/* Credit Card inserted */}
                <rect
                  x="30"
                  y="6"
                  width="70"
                  height="45"
                  rx="8"
                  fill="#60a5fa"
                  transform="rotate(-5 30 6)"
                />
                {/* Wallet Front Flap */}
                <rect
                  x="15"
                  y="24"
                  width="120"
                  height="68"
                  rx="14"
                  fill="url(#wallet_front)"
                />
                {/* Wallet Strap & Clasp */}
                <path
                  d="M100 48 L138 48 C144 48, 146 54, 146 58 C146 62, 144 68, 138 68 L100 68 Z"
                  fill="#4338ca"
                />
                <circle cx="134" cy="58" r="4.5" fill="#f8fafc" />
                <circle cx="134" cy="58" r="2.5" fill="#818cf8" />

                {/* Insignia 'S' Logo Stamp on Wallet Front */}
                <g transform="translate(35, 42) scale(0.75)">
                  <rect
                    x="2"
                    y="2"
                    width="32"
                    height="32"
                    rx="8"
                    fill="#312e81"
                    opacity="0.6"
                  />
                  <path
                    d="M12 11 C12 8, 24 8, 24 13 C24 18, 12 17, 12 23 C12 28, 24 28, 24 25"
                    stroke="#ffffff"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    fill="none"
                  />
                </g>
              </g>

              {/* Gradients */}
              <defs>
                <linearGradient id="btc_grad" x1="0" y1="0" x2="40" y2="40">
                  <stop offset="0%" stopColor="#fbbf24" />
                  <stop offset="100%" stopColor="#d97706" />
                </linearGradient>
                <linearGradient id="eth_glow" x1="0" y1="0" x2="40" y2="40">
                  <stop offset="0%" stopColor="#818cf8" />
                  <stop offset="100%" stopColor="#4338ca" />
                </linearGradient>
                <linearGradient id="usdt_grad" x1="0" y1="0" x2="32" y2="32">
                  <stop offset="0%" stopColor="#34d399" />
                  <stop offset="100%" stopColor="#059669" />
                </linearGradient>
                <linearGradient id="wallet_front" x1="15" y1="24" x2="135" y2="92">
                  <stop offset="0%" stopColor="#4f46e5" />
                  <stop offset="100%" stopColor="#3730a3" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ChangeBiodataModal
        isOpen={isEditBiodataOpen}
        onClose={() => {
          setIsEditBiodataOpen(false);
          refetchProfile();
        }}
        username={username}
      />

      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
        username={username}
      />

      <TransferModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        currentBalance={currentBalance}
      />
    </div>
  );
};
