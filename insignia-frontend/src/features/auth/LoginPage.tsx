import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from './useAuth';
import { loginSchema, LoginFormData } from './schemas';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Alert } from '@/components/ui/Alert';
import { DemoBadge } from '@/components/ui/DemoBadge';
import { APP_CONFIG } from '@/app/config';
import { Wallet, Eye, EyeOff, Lock, User, KeyRound, Info, ExternalLink } from 'lucide-react';
import { normalizeApiError } from '@/services/api/client';

export const LoginPage: React.FC = () => {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: APP_CONFIG.isDemoMode ? 'admin' : '',
      password: APP_CONFIG.isDemoMode ? 'admin123' : '',
    },
  });

  // If already authenticated and not already at destination, redirect immediately
  React.useEffect(() => {
    if (isAuthenticated && location.pathname !== from) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from, location.pathname]);

  const onSubmit = async (data: LoginFormData) => {
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      await login(data);
      navigate(from, { replace: true });
    } catch (err) {
      const normalized = normalizeApiError(err);
      setErrorMessage(normalized.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFillDemo = () => {
    setValue('username', 'admin', { shouldValidate: true });
    setValue('password', 'admin123', { shouldValidate: true });
    setErrorMessage(null);
  };

  const isLiveUnconfigured = APP_CONFIG.isLiveMode && !APP_CONFIG.isAuthLoginEndpointConfigured;

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-3">
          <div className="w-14 h-14 rounded-2xl bg-brand-600 flex items-center justify-center text-white shadow-md">
            <Wallet className="w-8 h-8" />
          </div>
        </div>
        <h2 className="text-center text-2xl sm:text-3xl font-extrabold tracking-tight text-navy-900">
          Insignia Wallet
        </h2>
        <p className="mt-1 text-center text-sm text-slate-500">
          Admin Portal & Cryptocurrency Dashboard
        </p>
        <div className="mt-3 flex justify-center">
          <DemoBadge />
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="shadow-lg border-slate-200">
          <CardHeader className="text-center pb-2">
            <CardTitle>Sign In</CardTitle>
            <CardDescription>
              Enter your credentials to access the admin console
            </CardDescription>
          </CardHeader>

          <CardContent>
            {isLiveUnconfigured ? (
              <Alert variant="warning" title="Live Authentication Unconfigured" className="mb-5">
                The documented Stoplight specification does not provide a username/password login endpoint.
                Please configure <code className="font-mono font-bold">VITE_AUTH_LOGIN_PATH</code> or switch
                to <code className="font-mono font-bold">VITE_DATA_MODE=demo</code> to test with MSW simulation.
              </Alert>
            ) : null}

            {errorMessage && (
              <Alert
                variant="error"
                title="Authentication Error"
                className="mb-5"
                onClose={() => setErrorMessage(null)}
              >
                {errorMessage}
              </Alert>
            )}

            {APP_CONFIG.isDemoMode && (
              <div className="mb-5 p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-100 flex items-start gap-3">
                <Info className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
                <div className="text-xs text-navy-800 flex-1">
                  <p className="font-semibold text-brand-700 mb-0.5">Demo Mode Active</p>
                  <p className="text-slate-600">
                    Preloaded credentials: <span className="font-mono font-bold">admin</span> / <span className="font-mono font-bold">admin123</span>
                  </p>
                  <button
                    type="button"
                    onClick={handleFillDemo}
                    className="mt-2 text-xs font-semibold text-brand-600 hover:text-brand-700 underline focus-ring rounded"
                  >
                    Auto-fill demo credentials
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="Username"
                type="text"
                autoComplete="username"
                placeholder="e.g. admin"
                disabled={isSubmitting || isLiveUnconfigured}
                leftIcon={<User className="w-4 h-4" />}
                error={errors.username?.message}
                {...register('username')}
              />

              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                disabled={isSubmitting || isLiveUnconfigured}
                leftIcon={<Lock className="w-4 h-4" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-slate-400 hover:text-navy-700 transition-colors focus-ring rounded p-1"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                }
                error={errors.password?.message}
                {...register('password')}
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full mt-2"
                isLoading={isSubmitting}
                disabled={isLiveUnconfigured}
              >
                <KeyRound className="w-4 h-4 mr-2" />
                Sign In to Dashboard
              </Button>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col gap-2.5 text-center text-xs text-slate-500">
              <div>
                Need to register a wallet token?{' '}
                <Link
                  to="/register"
                  className="font-semibold text-brand-600 hover:text-brand-700 underline inline-flex items-center gap-1"
                >
                  Documented POST /user flow
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
              <p className="text-[11px] text-slate-400">
                Stoplight API Reference Specification Demo
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
