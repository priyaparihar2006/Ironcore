import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight, Lock, Mail, User, Phone, Calendar, CheckCircle2, AlertCircle, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const FITNESS_GOALS = [
  'Weight Loss',
  'Muscle Gain',
  'Strength',
  'General Fitness',
  'Endurance',
];

export const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const { register, user } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('Prefer not to say');
  const [fitnessGoal, setFitnessGoal] = useState('General Fitness');
  const [agreeTerms, setAgreeTerms] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If already logged in, redirect
  React.useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim()) {
      setError('Please provide your full legal or preferred name.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please provide a valid email address.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please recheck.');
      return;
    }

    if (!agreeTerms) {
      setError('You must accept the IronCore Athletic Terms & Conditions to register.');
      return;
    }

    setLoading(true);
    try {
      // Register always auto-assigns USER role securely on backend
      await register({
        name: fullName,
        email,
        phone,
        password,
        confirmPassword,
        dateOfBirth,
        gender,
        fitnessGoal,
      });

      navigate('/dashboard');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F7FA] flex flex-col justify-center py-8 sm:py-14 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl w-full mx-auto bg-white rounded-[32px] sm:rounded-[40px] border border-neutral-200/80 shadow-2xl shadow-purple-950/5 overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        
        {/* Left Side Branding */}
        <div className="lg:col-span-5 bg-gradient-to-br from-[#080512] via-[#161026] to-[#25153f] p-8 sm:p-12 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10">
            <Link to="/" className="inline-flex items-center gap-2.5 mb-10 group">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-md">
                <div className="w-4 h-4 border-2 border-[#080512] rounded-full"></div>
              </div>
              <span className="text-2xl font-black tracking-tighter text-white">
                IronCore
              </span>
            </Link>

            <div className="inline-block px-3 py-1 rounded-full bg-white/10 text-purple-200 text-xs font-bold uppercase tracking-wider mb-4 backdrop-blur-sm">
              New Member Registration
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tighter text-white leading-tight mb-4">
              Begin your transformation.
            </h1>

            <p className="text-white/70 text-sm sm:text-base leading-relaxed max-w-sm mb-6">
              Join 12,000+ athletes. Personalized workout plans, intelligent progress tracking, and access to master coaches.
            </p>

            <div className="space-y-3 pt-4 border-t border-white/10">
              <div className="flex items-center gap-3 text-xs sm:text-sm text-white/80">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>14-Day Free Access with no lock-in</span>
              </div>
              <div className="flex items-center gap-3 text-xs sm:text-sm text-white/80">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Complimentary baseline athletic assessment</span>
              </div>
              <div className="flex items-center gap-3 text-xs sm:text-sm text-white/80">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Instant access to workout & macro tracker</span>
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-10 mt-auto">
            <div className="flex items-center gap-2 text-xs text-white/50">
              <Shield className="w-4 h-4 text-purple-400" />
              <span>256-bit encrypted data protection</span>
            </div>
          </div>
        </div>

        {/* Right Side Signup Form */}
        <div className="lg:col-span-7 p-8 sm:p-12 lg:p-14 flex flex-col justify-center">
          <div className="max-w-md w-full mx-auto">
            
            <div className="mb-8">
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-[#080512]">
                Create your athlete profile
              </h2>
              <p className="text-sm text-neutral-500 mt-1.5">
                Takes less than 60 seconds to get your digital access key.
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-600" />
                <div>
                  <div className="font-bold">Registration incomplete</div>
                  <div className="text-xs text-red-600 mt-0.5">{error}</div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-[#080512] uppercase tracking-wider mb-1.5">
                  Full Name *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Jordan Reed"
                    className="w-full pl-10 pr-4 py-3 rounded-2xl border border-neutral-200 bg-neutral-50/50 text-[#080512] placeholder-neutral-400 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#080512] focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Email & Phone (2 cols on sm) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#080512] uppercase tracking-wider mb-1.5">
                    Email Address *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="jordan@example.com"
                      className="w-full pl-10 pr-4 py-3 rounded-2xl border border-neutral-200 bg-neutral-50/50 text-[#080512] placeholder-neutral-400 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#080512] focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#080512] uppercase tracking-wider mb-1.5">
                    Phone Number
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                      <Phone className="w-4 h-4" />
                    </div>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      className="w-full pl-10 pr-4 py-3 rounded-2xl border border-neutral-200 bg-neutral-50/50 text-[#080512] placeholder-neutral-400 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#080512] focus:bg-white transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Date of Birth & Gender */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#080512] uppercase tracking-wider mb-1.5">
                    Date of Birth
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <input
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-2xl border border-neutral-200 bg-neutral-50/50 text-[#080512] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#080512] focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#080512] uppercase tracking-wider mb-1.5">
                    Gender (Optional)
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-neutral-200 bg-neutral-50/50 text-[#080512] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#080512] focus:bg-white transition-all"
                  >
                    <option value="Prefer not to say">Prefer not to say</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Non-binary">Non-binary</option>
                  </select>
                </div>
              </div>

              {/* Primary Fitness Goal */}
              <div>
                <label className="block text-xs font-bold text-[#080512] uppercase tracking-wider mb-1.5">
                  Primary Fitness Goal *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {FITNESS_GOALS.map((goal) => (
                    <button
                      type="button"
                      key={goal}
                      onClick={() => setFitnessGoal(goal)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border text-center ${
                        fitnessGoal === goal
                          ? 'bg-[#080512] text-white border-[#080512] shadow-sm'
                          : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100'
                      }`}
                    >
                      {goal}
                    </button>
                  ))}
                </div>
              </div>

              {/* Password & Confirm */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#080512] uppercase tracking-wider mb-1.5">
                    Password *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min 8 chars"
                      className="w-full pl-10 pr-10 py-3 rounded-2xl border border-neutral-200 bg-neutral-50/50 text-[#080512] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#080512] focus:bg-white transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-neutral-700"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#080512] uppercase tracking-wider mb-1.5">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat password"
                      className="w-full pl-10 pr-4 py-3 rounded-2xl border border-neutral-200 bg-neutral-50/50 text-[#080512] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#080512] focus:bg-white transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Terms Checkbox */}
              <div className="pt-2">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    required
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="w-4 h-4 mt-0.5 rounded border-neutral-300 text-[#080512] focus:ring-[#080512]"
                  />
                  <span className="text-xs text-neutral-600 leading-tight">
                    I agree to the <span className="font-bold text-[#080512]">IronCore Club Terms of Service</span> and acknowledge the gym liability policy.
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                id="signup-submit-btn"
                className="w-full py-4 rounded-2xl bg-[#080512] text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-xl shadow-purple-950/10 hover:bg-neutral-800 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mt-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Creating account...</span>
                  </>
                ) : (
                  <>
                    <span>Complete Registration</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-neutral-600">
              Already have an account?{' '}
              <Link to="/login" className="font-bold text-[#080512] hover:underline underline-offset-4">
                Sign In
              </Link>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
