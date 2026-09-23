import { ValidationInput, useFormValidation } from '../components/ValidationInput';
import { emailError, normalizeEmail } from '../lib/validation';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowRight, ArrowLeft, CheckCircle2, AlertCircle, KeyRound } from 'lucide-react';
import { apiRequest } from '../lib/api';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validation = useFormValidation({ email: emailError(email) });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (loading || !validation.validate()) return;

    setLoading(true);
    try {
      await apiRequest<{ message: string }>(
        '/auth/forgot-password',
        {
          method: 'POST',
          body: JSON.stringify({ email: normalizeEmail(email) }),
        }
      );

      setSubmitted(true);

    } catch (err: unknown) {
      validation.server(err);
      const msg = err instanceof Error ? err.message : 'Unable to dispatch reset email.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-brand-bg)] flex flex-col justify-center py-12 px-4 md:px-8 lg:px-12">
      <div className="max-w-md w-full mx-auto bg-white rounded-lg p-8 sm:p-10 border border-[var(--color-border-main)]/80 shadow-sm">
        
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-lg bg-[var(--color-primary)]/20 text-[var(--color-text-main)] flex items-center justify-center mx-auto mb-4">
            <KeyRound className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-[var(--color-text-main)]">
            Reset Password
          </h2>
          <p className="text-xs sm:text-sm text-[var(--color-text-muted)] mt-2">
            Enter the email address tied to your IronCore profile and we'll send you recovery instructions.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-6 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-3">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {submitted ? (
          <div className="space-y-6">
            <div className="p-6 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm">
              <div className="flex items-center gap-2 font-bold mb-1">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                Reset Link Dispatched
              </div>
              <p className="text-xs text-emerald-800 leading-relaxed">
                If an account exists for <span className="font-semibold">{email}</span>, a secure recovery link is ready.
              </p>
            </div>


            <Link
              to="/login"
              className="w-full py-3.5 rounded-lg bg-[var(--color-primary)] text-[var(--color-text-main)] font-bold text-sm flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Sign In</span>
            </Link>
          </div>
        ) : (
          <form noValidate onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-[var(--color-text-main)] uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--color-text-muted)]">
                  <Mail className="w-5 h-5" />
                </div>
                <ValidationInput {...validation.field('email', 'Email address')}
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-[var(--color-border-main)] shadow-sm bg-neutral-50/50 text-[var(--color-text-main)] placeholder-neutral-400 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                maxLength={254} autoComplete="email" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-lg bg-[var(--color-primary)] text-[var(--color-text-main)] font-bold text-sm flex items-center justify-center gap-2 hover:bg-neutral-800 transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <span>Sending...</span>
              ) : (
                <>
                  <span>Send Reset Instructions</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="text-center pt-2">
              <Link
                to="/login"
                className="text-xs font-bold text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] transition-colors inline-flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Return to sign in
              </Link>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
