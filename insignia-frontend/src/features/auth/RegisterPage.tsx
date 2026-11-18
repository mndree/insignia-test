import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from './useAuth';
import { registerWalletSchema, RegisterWalletFormData } from './schemas';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Alert } from '@/components/ui/Alert';
import { DemoBadge } from '@/components/ui/DemoBadge';
import { Wallet, UserPlus, ArrowLeft, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { normalizeApiError } from '@/services/api/client';

export const RegisterPage: React.FC = () => {
  const { registerWallet } = useAuth();
  const navigate = useNavigate();

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successToken, setSuccessToken] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterWalletFormData>({
    resolver: zodResolver(registerWalletSchema),
    defaultValues: {
      username: '',
    },
  });

  const onSubmit = async (data: RegisterWalletFormData) => {
    setErrorMessage(null);
    setSuccessToken(null);
    setIsSubmitting(true);
    try {
      const token = await registerWallet(data);
      setSuccessToken(token);
    } catch (err) {
      const normalized = normalizeApiError(err);
      setErrorMessage(normalized.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-3">
          <div className="w-14 h-14 rounded-2xl bg-brand-600 flex items-center justify-center text-white shadow-md">
            <Wallet className="w-8 h-8" />
          </div>
        </div>
        <h2 className="text-center text-2xl sm:text-3xl font-extrabold tracking-tight text-navy-900">
          Wallet Registration
        </h2>
        <p className="mt-1 text-center text-sm text-slate-500">
          Documented Stoplight <code className="font-mono font-bold">POST /user</code> Contract
        </p>
        <div className="mt-3 flex justify-center">
          <DemoBadge />
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="shadow-lg border-slate-200">
          <CardHeader className="text-center pb-2">
            <CardTitle>Register New Wallet</CardTitle>
            <CardDescription>
              Create a wallet identity with unique username
            </CardDescription>
          </CardHeader>

          <CardContent>
            {/* Specification Context Callout */}
            <div className="mb-5 p-3.5 rounded-xl bg-amber-50/80 border border-amber-200/70 text-xs text-amber-900 flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-800">Specification Context</p>
                <p className="mt-0.5 text-amber-900/90 leading-relaxed">
                  The documented Stoplight API specifies only a username registration endpoint returning a token.
                  It does not include password credentials or role management. A wallet token represents identity,
                  not proof of administrative authorization.
                </p>
              </div>
            </div>

            {errorMessage && (
              <Alert
                variant="error"
                title="Registration Failed"
                className="mb-5"
                onClose={() => setErrorMessage(null)}
              >
                {errorMessage}
              </Alert>
            )}

            {successToken ? (
              <div className="space-y-4">
                <Alert
                  variant="success"
                  title="Wallet Registered Successfully!"
                >
                  <p className="text-xs text-emerald-800">
                    A wallet token was issued and set for your active session.
                  </p>
                  <div className="mt-2 p-2 bg-emerald-100/60 rounded border border-emerald-200 font-mono text-[11px] break-all select-all text-emerald-950">
                    {successToken}
                  </div>
                </Alert>

                <Button
                  variant="primary"
                  className="w-full"
                  onClick={() => navigate('/', { replace: true })}
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Proceed to Dashboard
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input
                  label="Unique Username"
                  type="text"
                  placeholder="e.g. satoshi_2026"
                  disabled={isSubmitting}
                  error={errors.username?.message}
                  helperText="Must be unique across the network."
                  {...register('username')}
                />

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full mt-2"
                  isLoading={isSubmitting}
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Create Wallet
                </Button>
              </form>
            )}

            <div className="mt-6 pt-5 border-t border-slate-100 text-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700 underline"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Return to Login Page
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
