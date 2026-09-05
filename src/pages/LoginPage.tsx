import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight, Lock, Mail, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, user } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // If already logged in, redirect
  React.useEffect(() => {
    if (user) {
      if (user.role === 'ADMIN') navigate('/admin');
      else if (user.role === 'TRAINER') navigate('/trainer');
      else navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      const loggedUser = await login(email, password, rememberMe);
      setSuccessToast(`Welcome back, ${loggedUser.name}!`);

      // Determine redirect path
      const searchParams = new URLSearchParams(location.search);
      const redirectPath = searchParams.get('redirect');

      setTimeout(() => {
        if (redirectPath) {
          navigate(redirectPath);
        } else if (loggedUser.role === 'ADMIN') {
          navigate('/admin');
        } else if (loggedUser.role === 'TRAINER') {
          navigate('/trainer');
        } else {
          navigate('/dashboard');
        }
      }, 500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid credentials. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#F8F7FA] flex flex-col justify-center py-6 sm:py-12 px-4 sm:px-6 lg:px-8">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-6 right-6 z-50 bg-[#080512] text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-purple-500/20 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-bold">{successToast}</span>
        </div>
      )}

      <div className="max-w-5xl w-full mx-auto bg-white rounded-[32px] sm:rounded-[40px] border border-neutral-200/80 shadow-2xl shadow-purple-950/5 overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        
        {/* Left Editorial Visual Section */}
        <div className="lg:col-span-5 bg-gradient-to-br from-[#080512] via-[#161026] to-[#25153f] p-8 sm:p-12 text-white flex flex-col justify-between relative overflow-hidden">
          {/* Ambient Glows */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10">
            {/* Logo */}
            <Link to="/" className="inline-flex items-center gap-2.5 mb-10 group">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-md">
                <div className="w-4 h-4 border-2 border-[#080512] rounded-full"></div>
              </div>
              <span className="text-2xl font-black tracking-tighter text-white">
                IronCore
              </span>
            </Link>

            <div className="inline-block px-3 py-1 rounded-full bg-white/10 text-purple-200 text-xs font-bold uppercase tracking-wider mb-4 backdrop-blur-sm">
              Member Access
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tighter text-white leading-tight mb-4">
              Welcome back.
            </h1>

            <p className="text-white/70 text-sm sm:text-base leading-relaxed max-w-sm">
              Continue your discipline. Access your daily workout splits, nutrition logs, personal coaching, and real performance metrics.
            </p>
          </div>

          <div className="relative z-10 pt-10">
            {/* Athletic Visual Card */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex items-center gap-4">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&h=120&q=80"
                alt="Trainer"
                referrerPolicy="no-referrer"
                className="w-12 h-12 rounded-xl object-cover border border-white/20"
              />
              <div>
                <div className="text-xs font-semibold text-purple-200">Daily Mantra</div>
                <div className="text-sm font-bold text-white">"Consistency compounds faster than intensity."</div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between text-xs text-white/50">
              <span>© 2026 IronCore Club</span>
              <Link to="/" className="hover:text-white transition-colors">
                Back to Home →
              </Link>
            </div>
          </div>
        </div>

        {/* Right Form Section */}
        <div className="lg:col-span-7 p-8 sm:p-12 lg:p-14 flex flex-col justify-center">
          
          <div className="max-w-md w-full mx-auto">
            
            <div className="mb-8">
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-[#080512]">
                Sign in to your account
              </h2>
              <p className="text-sm text-neutral-500 mt-1.5">
                Enter your credentials to enter your IronCore portal.
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-3 animate-shake">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-600" />
                <div>
                  <div className="font-bold">Authentication failed</div>
                  <div className="text-xs text-red-600 mt-0.5">{error}</div>
                </div>
              </div>
            )}

            {/* Sign In Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Email Field */}
              <div>
                <label className="block text-xs font-bold text-[#080512] uppercase tracking-wider mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-400">
                    <Mail className="w-5 h-5" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-neutral-200 bg-neutral-50/50 text-[#080512] placeholder-neutral-400 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#080512] focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-[#080512] uppercase tracking-wider">
                    Password
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-xs font-bold text-purple-700 hover:text-purple-900 transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-400">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-11 pr-12 py-3.5 rounded-2xl border border-neutral-200 bg-neutral-50/50 text-[#080512] placeholder-neutral-400 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#080512] focus:bg-white transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-neutral-400 hover:text-neutral-700 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-neutral-300 text-[#080512] focus:ring-[#080512]"
                  />
                  <span className="text-xs font-semibold text-neutral-600">
                    Remember this device for 30 days
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                id="login-submit-btn"
                className="w-full py-4 rounded-2xl bg-[#080512] text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-xl shadow-purple-950/10 hover:bg-neutral-800 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Accounts Selection */}
            <div className="mt-8 pt-6 border-t border-neutral-200/70">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                  1-Click Demo Accounts
                </span>
                <span className="text-[10px] text-neutral-400">Click to fill</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickFill('admin@ironcore.fit', 'AdminPassword123!')}
                  className="px-2.5 py-2 rounded-xl text-left bg-purple-50 hover:bg-purple-100 border border-purple-200/70 transition-all text-xs"
                >
                  <div className="font-bold text-purple-900">Admin</div>
                  <div className="text-[10px] text-purple-700 truncate">Alex Vance</div>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFill('marcus@ironcore.fit', 'TrainerPassword123!')}
                  className="px-2.5 py-2 rounded-xl text-left bg-blue-50 hover:bg-blue-100 border border-blue-200/70 transition-all text-xs"
                >
                  <div className="font-bold text-blue-900">Trainer</div>
                  <div className="text-[10px] text-blue-700 truncate">Coach Marcus</div>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFill('jordan@ironcore.fit', 'UserPassword123!')}
                  className="px-2.5 py-2 rounded-xl text-left bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/70 transition-all text-xs"
                >
                  <div className="font-bold text-emerald-900">Member</div>
                  <div className="text-[10px] text-emerald-700 truncate">Jordan Reed</div>
                </button>
              </div>
            </div>

            {/* Link to Sign Up */}
            <div className="mt-8 text-center text-sm text-neutral-600">
              Don't have an account?{' '}
              <Link
                to="/signup"
                className="font-bold text-[#080512] hover:underline underline-offset-4"
              >
                Create account
              </Link>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
