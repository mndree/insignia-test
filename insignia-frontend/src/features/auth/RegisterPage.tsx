import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from './useAuth';
import { Alert } from '@/components/ui/Alert';
import { normalizeApiError } from '@/services/api/client';
import { checkUsernameApi } from '@/services/api/endpoints';
import { formatPhoneNumber } from '@/utils/masking';
import { cn } from '@/utils/cn';
import insigniaLogo from '@/assets/logo.png';
import {
  User,
  Lock,
  Eye,
  EyeOff,
  Mail,
  Phone,
  UserPlus,
  Check,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';
import { DatePickerInput } from '@/components/ui/DatePickerInput';

export const RegisterPage: React.FC = () => {
  const { registerWallet } = useAuth();
  const navigate = useNavigate();

  // Current Step: 1, 2, or 3
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Form State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  // Password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Submission & feedback state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [stepError, setStepError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Validation for Step 1
  const validateStep1 = (): boolean => {
    setStepError(null);
    setUsernameError(null);
    const cleanUser = username.trim();
    if (!cleanUser) {
      setStepError('Username is required.');
      setUsernameError('Username is required.');
      return false;
    }
    if (cleanUser.length < 3) {
      setStepError('Username must be at least 3 characters.');
      setUsernameError('Username must be at least 3 characters.');
      return false;
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(cleanUser)) {
      setStepError('Username can only contain letters, numbers, underscores, and hyphens.');
      setUsernameError('Username can only contain letters, numbers, underscores, and hyphens.');
      return false;
    }
    if (!password) {
      setStepError('Password is required.');
      return false;
    }
    if (password.length < 8) {
      setStepError('Password must be at least 8 characters.');
      return false;
    }
    if (password !== confirmPassword) {
      setStepError('Passwords do not match.');
      return false;
    }
    return true;
  };

  const handleCheckUsernameBlur = async () => {
    const cleanUser = username.trim();
    if (!cleanUser || cleanUser.length < 3) return;
    setIsCheckingUsername(true);
    try {
      const res = await checkUsernameApi(cleanUser);
      if (res.exists || !res.available) {
        const errorMsg =
          res.message || `Username '${cleanUser}' is already taken in system.`;
        setUsernameError(errorMsg);
      } else {
        setUsernameError(null);
      }
    } catch {
      // Ignore network errors on blur
    } finally {
      setIsCheckingUsername(false);
    }
  };

  const handleNextFromStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    setUsernameError(null);
    setStepError(null);

    if (!validateStep1()) {
      return;
    }

    setIsCheckingUsername(true);
    try {
      const res = await checkUsernameApi(username.trim());
      if (res.exists || !res.available) {
        const errorMsg =
          res.message || `Username '${username.trim()}' is already taken.`;
        setStepError(errorMsg);
        setUsernameError(errorMsg);
        return;
      }

      // Username is available, advance to Step 2
      setCurrentStep(2);
    } catch (err) {
      const normalized = normalizeApiError(err);
      setStepError(normalized.message);
      setUsernameError(normalized.message);
    } finally {
      setIsCheckingUsername(false);
    }
  };

  const handleNextFromStep2 = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setStepError(null);
    setCurrentStep(3);
  };

  const handleFinalSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setStepError(null);
    setIsSubmitting(true);

    try {
      await registerWallet({
        username: username.trim(),
        password: password,
        fullName: fullName.trim() || undefined,
        dateOfBirth: dateOfBirth.trim() || undefined,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
      });

      setSuccess(true);
      setTimeout(() => {
        navigate('/users', { replace: true });
      }, 1500);
    } catch (err) {
      const normalized = normalizeApiError(err);
      setStepError(normalized.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-center items-center py-10 px-4 sm:px-6">
      {/* Brand Header */}
      <div className="flex flex-col items-center mb-6 text-center">
        <img
          src={insigniaLogo}
          alt="Insignia Wallet"
          className="w-12 h-12 rounded-2xl shadow-sm mb-3 select-none"
        />
        <h1 className="text-2xl font-black tracking-tight text-navy-900">
          Insignia Wallet
        </h1>
        <p className="text-xs text-slate-500 font-medium mt-1">
          Admin Portal & Cryptocurrency Dashboard
        </p>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-[500px] sm:max-w-[520px] bg-white rounded-3xl p-7 sm:p-9 shadow-sm border border-slate-200/80 transition-all">
        {/* Stepper Progress */}
        <div className="flex items-center justify-between mb-8 px-2 sm:px-4 select-none">
          {/* Step 1 Node */}
          <div className="flex flex-col items-center min-w-[64px]">
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-2xs',
                currentStep >= 1
                  ? 'bg-brand-600 text-white'
                  : 'border-2 border-slate-200 text-slate-400 bg-white'
              )}
            >
              {currentStep > 1 ? <Check className="w-4 h-4 stroke-[3]" /> : '1'}
            </div>
            <span
              className={cn(
                'text-[11px] font-semibold mt-1.5 transition-colors',
                currentStep >= 1 ? 'text-brand-600' : 'text-slate-400'
              )}
            >
              Account
            </span>
          </div>

          {/* Connecting Line 1 -> 2 */}
          <div
            className={cn(
              'flex-1 h-[2px] mx-1 sm:mx-2 -mt-5 transition-colors',
              currentStep > 1 ? 'bg-brand-600' : 'bg-slate-200'
            )}
          />

          {/* Step 2 Node */}
          <div className="flex flex-col items-center min-w-[76px]">
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-2xs',
                currentStep >= 2
                  ? 'bg-brand-600 text-white'
                  : 'border-2 border-slate-200 text-slate-400 bg-white'
              )}
            >
              {currentStep > 2 ? <Check className="w-4 h-4 stroke-[3]" /> : '2'}
            </div>
            <span
              className={cn(
                'text-[11px] font-semibold mt-1.5 transition-colors',
                currentStep >= 2 ? 'text-brand-600' : 'text-slate-400'
              )}
            >
              Personal Info
            </span>
          </div>

          {/* Connecting Line 2 -> 3 */}
          <div
            className={cn(
              'flex-1 h-[2px] mx-1 sm:mx-2 -mt-5 transition-colors',
              currentStep > 2 ? 'bg-brand-600' : 'bg-slate-200'
            )}
          />

          {/* Step 3 Node */}
          <div className="flex flex-col items-center min-w-[64px]">
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-2xs',
                currentStep === 3
                  ? 'bg-brand-600 text-white'
                  : 'border-2 border-slate-200 text-slate-400 bg-white'
              )}
            >
              3
            </div>
            <span
              className={cn(
                'text-[11px] font-semibold mt-1.5 transition-colors',
                currentStep === 3 ? 'text-brand-600' : 'text-slate-400'
              )}
            >
              Contact
            </span>
          </div>
        </div>

        {/* Success Alert */}
        {success ? (
          <div className="py-8 flex flex-col items-center text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mb-1">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-navy-900">Account Created!</h2>
            <p className="text-sm text-slate-500 max-w-xs">
              Welcome, <strong className="text-navy-900">@{username}</strong>. Your profile has
              been stored in the system. Redirecting you...
            </p>
          </div>
        ) : (
          <>
            {/* Step Heading, Subtitle & Badge */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-extrabold text-navy-900">
                {currentStep === 1 && 'Create your account'}
                {currentStep === 2 && 'Personal information'}
                {currentStep === 3 && 'Contact details'}
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                {currentStep === 1 && 'Set up your sign-in details'}
                {currentStep === 2 && 'Tell us a little about yourself'}
                {currentStep === 3 && 'Add your contact information'}
              </p>
              <div className="flex justify-center mt-3">
                <span className="px-3.5 py-1 rounded-full bg-slate-100/90 text-slate-500 text-xs font-medium">
                  Step {currentStep} of 3
                </span>
              </div>
            </div>

            {/* Error Message */}
            {stepError && (
              <Alert variant="error" className="mb-5" onClose={() => setStepError(null)}>
                {stepError}
              </Alert>
            )}

            {/* STEP 1: ACCOUNT */}
            {currentStep === 1 && (
              <form onSubmit={handleNextFromStep1} className="space-y-4">
                {/* Username */}
                <div>
                  <label className="block text-[11px] font-bold text-navy-900 uppercase tracking-wide mb-1.5">
                    USERNAME <span className="text-brand-600">*</span>
                  </label>
                  <div
                    className={cn(
                      'relative flex items-center rounded-xl border bg-[#f4f7fe]/80 focus-within:bg-white focus-within:ring-2 transition-all',
                      usernameError
                        ? 'border-rose-400 bg-rose-50/30 focus-within:border-rose-500 focus-within:ring-rose-500/20'
                        : 'border-indigo-100/90 focus-within:border-brand-500 focus-within:ring-brand-500/20'
                    )}
                  >
                    <User
                      className={cn(
                        'w-4 h-4 ml-3.5 shrink-0',
                        usernameError ? 'text-rose-400' : 'text-slate-400'
                      )}
                    />
                    <input
                      type="text"
                      placeholder="Choose a username"
                      value={username}
                      onChange={(e) => {
                        setUsername(e.target.value);
                        if (usernameError) setUsernameError(null);
                        if (stepError) setStepError(null);
                      }}
                      onBlur={handleCheckUsernameBlur}
                      className="w-full bg-transparent px-3 py-2.5 text-sm text-navy-900 placeholder:text-slate-400 focus:outline-none"
                      required
                    />
                    {isCheckingUsername && (
                      <div className="mr-3 shrink-0">
                        <div className="w-4 h-4 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </div>
                  {usernameError && (
                    <p className="text-xs text-rose-600 font-medium mt-1.5 flex items-center gap-1">
                      <span>•</span> {usernameError}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label className="block text-[11px] font-bold text-navy-900 uppercase tracking-wide mb-1.5">
                    PASSWORD <span className="text-brand-600">*</span>
                  </label>
                  <div className="relative flex items-center rounded-xl border border-indigo-100/90 bg-[#f4f7fe]/80 focus-within:bg-white focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20 transition-all">
                    <Lock className="w-4 h-4 text-slate-400 ml-3.5 shrink-0" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Create a password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-transparent px-3 py-2.5 text-sm text-navy-900 placeholder:text-slate-400 focus:outline-none"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="mr-3 text-slate-400 hover:text-navy-700 transition-colors focus:outline-none cursor-pointer"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-slate-400 mt-1.5 font-medium">
                    Use at least 8 characters
                  </p>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-[11px] font-bold text-navy-900 uppercase tracking-wide mb-1.5">
                    CONFIRM PASSWORD <span className="text-brand-600">*</span>
                  </label>
                  <div className="relative flex items-center rounded-xl border border-indigo-100/90 bg-[#f4f7fe]/80 focus-within:bg-white focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20 transition-all">
                    <Lock className="w-4 h-4 text-slate-400 ml-3.5 shrink-0" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-transparent px-3 py-2.5 text-sm text-navy-900 placeholder:text-slate-400 focus:outline-none"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      className="mr-3 text-slate-400 hover:text-navy-700 transition-colors focus:outline-none cursor-pointer"
                      title={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <p className="text-xs text-navy-900/60 font-medium pt-1">
                  * Required fields
                </p>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isCheckingUsername}
                  className="w-full py-3 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer mt-4 disabled:opacity-75 disabled:cursor-not-allowed"
                >
                  {isCheckingUsername ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Checking availability...</span>
                    </>
                  ) : (
                    <>
                      <span>Continue</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* STEP 2: PERSONAL INFORMATION */}
            {currentStep === 2 && (
              <form onSubmit={handleNextFromStep2} className="space-y-4">
                {/* Full Name */}
                <div>
                  <label className="block text-[11px] font-bold text-navy-900 uppercase tracking-wide mb-1.5">
                    FULL NAME (optional)
                  </label>
                  <div className="relative flex items-center rounded-xl border border-indigo-100/90 bg-[#f4f7fe]/80 focus-within:bg-white focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20 transition-all">
                    <User className="w-4 h-4 text-slate-400 ml-3.5 shrink-0" />
                    <input
                      type="text"
                      placeholder="Enter your full name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-transparent px-3 py-2.5 text-sm text-navy-900 placeholder:text-slate-400 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Date of Birth DatePicker */}
                <div>
                  <DatePickerInput
                    label="DATE OF BIRTH (OPTIONAL)"
                    value={dateOfBirth}
                    onChange={setDateOfBirth}
                    placeholder="Select date of birth"
                    variant="register"
                    leftIcon={true}
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <p className="text-xs text-slate-400 font-medium pt-1">
                  You can update these details later.
                </p>

                {/* Back and Continue Buttons */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="px-6 py-2.5 rounded-xl border border-brand-600 text-brand-600 hover:bg-brand-50/60 font-semibold text-sm transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>

                  <button
                    type="submit"
                    className="flex-1 py-2.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Continue</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Skip for now */}
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="w-full text-center text-xs font-semibold text-brand-600 hover:underline mt-4 cursor-pointer block"
                >
                  Skip for now
                </button>
              </form>
            )}

            {/* STEP 3: CONTACT DETAILS */}
            {currentStep === 3 && (
              <form onSubmit={handleFinalSubmit} className="space-y-4">
                {/* Email Address */}
                <div>
                  <label className="block text-[11px] font-bold text-navy-900 uppercase tracking-wide mb-1.5">
                    EMAIL ADDRESS (optional)
                  </label>
                  <div className="relative flex items-center rounded-xl border border-indigo-100/90 bg-[#f4f7fe]/80 focus-within:bg-white focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20 transition-all">
                    <Mail className="w-4 h-4 text-slate-400 ml-3.5 shrink-0" />
                    <input
                      type="email"
                      placeholder="Enter your email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-transparent px-3 py-2.5 text-sm text-navy-900 placeholder:text-slate-400 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-[11px] font-bold text-navy-900 uppercase tracking-wide mb-1.5">
                    PHONE NUMBER (optional)
                  </label>
                  <div className="relative flex items-center rounded-xl border border-indigo-100/90 bg-[#f4f7fe]/80 focus-within:bg-white focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20 transition-all">
                    <Phone className="w-4 h-4 text-slate-400 ml-3.5 shrink-0" />
                    <input
                      type="tel"
                      placeholder="Enter your phone number"
                      value={phone}
                      onChange={(e) => setPhone(formatPhoneNumber(e.target.value))}
                      className="w-full bg-transparent px-3 py-2.5 text-sm text-navy-900 placeholder:text-slate-400 focus:outline-none font-mono text-xs sm:text-sm"
                    />
                  </div>
                </div>

                {/* Address */}
                <div>
                  <label className="block text-[11px] font-bold text-navy-900 uppercase tracking-wide mb-1.5">
                    ADDRESS (optional)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Enter your address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full rounded-xl border border-indigo-100/90 bg-[#f4f7fe]/80 focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 p-3 text-sm text-navy-900 placeholder:text-slate-400 focus:outline-none resize-none transition-all"
                  />
                </div>

                <p className="text-xs text-slate-400 font-medium pt-1">
                  You can update these details later.
                </p>

                {/* Back and Create Account Buttons */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    disabled={isSubmitting}
                    className="px-6 py-2.5 rounded-xl border border-brand-600 text-brand-600 hover:bg-brand-50/60 font-semibold text-sm transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
                  >
                    {isSubmitting ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        <span>Create Account</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </>
        )}

        {/* Footer Link */}
        <div className="mt-8 pt-5 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-500 font-medium">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-bold text-brand-600 hover:underline transition-colors"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
