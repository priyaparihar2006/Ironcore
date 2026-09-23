import { ValidationInput, useFormValidation } from '../components/ValidationInput';
import { passwordError, confirmPasswordError } from '../lib/validation';
import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, KeyRound } from 'lucide-react';
import { apiRequest } from '../lib/api';

export const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const validation = useFormValidation({ newPassword: passwordError(newPassword), confirmPassword: confirmPasswordError(newPassword, confirmPassword) });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError('Password reset token is missing or invalid.');
      return;
    }

    if (loading || !validation.validate()) return;

    setLoading(true);
    try {
      await apiRequest('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, email, newPassword, confirmPassword }),
      });

      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: unknown) {
      validation.server(err);
      const msg = err instanceof Error ? err.message : 'Failed to reset password.';
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
            Create New Password
          </h2>
          <p className="text-xs sm:text-sm text-[var(--color-text-muted)] mt-2">
            Enter a secure password for your IronCore athlete account.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-6 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-3">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="p-8 rounded-lg bg-emerald-50 border border-emerald-200 text-center space-y-3">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <div className="font-bold text-emerald-950">Password Successfully Reset!</div>
            <p className="text-xs text-emerald-800">
              Your new password is now active. Redirecting you to the sign-in page...
            </p>
          </div>
        ) : (
          <form noValidate onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[var(--color-text-main)] uppercase tracking-wider mb-1.5">
                New Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--color-text-muted)]">
                  <Lock className="w-4 h-4" />
                </div>
                <ValidationInput {...validation.field('newPassword', 'New password')}
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  className="w-full pl-10 pr-10 py-3.5 rounded-xl border border-[var(--color-border-main)] shadow-sm bg-neutral-50/50 text-[var(--color-text-main)] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                maxLength={256} autoComplete="new-password" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[var(--color-text-muted)] hover:text-neutral-700"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--color-text-main)] uppercase tracking-wider mb-1.5">
                Confirm New Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--color-text-muted)]">
                  <Lock className="w-4 h-4" />
                </div>
                <ValidationInput {...validation.field('confirmPassword', 'Confirm password')}
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full pl-10 pr-4 py-3.5 rounded-xl border border-[var(--color-border-main)] shadow-sm bg-neutral-50/50 text-[var(--color-text-main)] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                maxLength={256} autoComplete="new-password" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-lg bg-[var(--color-primary)] text-[var(--color-text-main)] font-bold text-sm hover:bg-neutral-800 transition-all cursor-pointer disabled:opacity-50 mt-2"
            >
              {loading ? 'Updating Password...' : 'Save New Password & Sign In'}
            </button>

            <div className="text-center pt-2">
              <Link to="/login" className="text-xs font-bold text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]">
                Back to Sign In
              </Link>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
