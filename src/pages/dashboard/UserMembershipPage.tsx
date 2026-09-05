import React, { useEffect, useState } from 'react';
import { CreditCard, Check, ShieldCheck, Sparkles, AlertCircle, ArrowRight, Zap, CheckCircle2 } from 'lucide-react';
import { apiRequest } from '../../lib/api';
import { UserMembershipData } from '../../types';

interface Plan {
  id: string;
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  description: string;
  badge?: string;
  features: string[];
}

export const UserMembershipPage: React.FC = () => {
  const [membership, setMembership] = useState<UserMembershipData | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const fetchMembership = async () => {
    try {
      setLoading(true);
      const res = await apiRequest<{ membership: UserMembershipData; plans: Plan[] }>('/user/membership');
      setMembership(res.membership);
      setPlans(res.plans || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load membership details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembership();
  }, []);

  const handleUpgrade = async (planId: string, planName: string) => {
    try {
      setUpgrading(planId);
      await apiRequest('/user/membership/upgrade', {
        method: 'POST',
        body: JSON.stringify({ planId, billingCycle }),
      });
      setSuccessToast(`Plan successfully updated to ${planName}!`);
      await fetchMembership();
      setTimeout(() => setSuccessToast(null), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setUpgrading(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-neutral-200 rounded-xl w-64"></div>
        <div className="h-64 bg-neutral-200 rounded-3xl"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {successToast && (
        <div className="fixed top-6 right-6 z-50 bg-[#080512] text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-purple-500/20 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-bold">{successToast}</span>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#080512]">
          Membership & Privileges
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          Review your active gym tier, facility access credentials, billing schedule, and available upgrades.
        </p>
      </div>

      {/* Current Active Plan Hero Card */}
      <div className="bg-gradient-to-br from-[#080512] via-[#1a122e] to-[#2e1a50] text-white rounded-[32px] p-6 sm:p-8 relative overflow-hidden shadow-2xl shadow-purple-950/10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-purple-200 text-xs font-bold uppercase tracking-wider mb-3">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Active Status: {membership?.status || 'ACTIVE'}
            </div>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tighter text-white">
              {membership?.planName || 'Pro'} Member
            </h2>
            <p className="text-white/70 text-xs sm:text-sm mt-1 max-w-md">
              Full facility access, personal training credits, recovery suite, and digital workout synchronizer.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/10 text-xs">
              <div>
                <span className="text-white/50 block">Start Date</span>
                <span className="font-bold text-white mt-0.5 block">{membership?.startDate || '2025-01-10'}</span>
              </div>
              <div>
                <span className="text-white/50 block">Renewal / Expiry</span>
                <span className="font-bold text-white mt-0.5 block">{membership?.expiryDate || '2027-01-10'}</span>
              </div>
              <div>
                <span className="text-white/50 block">Billing Cycle</span>
                <span className="font-bold text-emerald-400 mt-0.5 block capitalize">
                  ${membership?.pricePaid || 89} / {membership?.billingCycle || 'month'}
                </span>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 flex flex-col items-center justify-center text-center self-stretch md:self-auto min-w-[200px]">
            <Sparkles className="w-8 h-8 text-purple-300 mb-2" />
            <div className="text-xs font-bold text-white/70">Payment Method</div>
            <div className="text-sm font-black text-white mt-0.5">Primary Card •••• 4242</div>
            <div className="text-[10px] text-emerald-400 mt-1 font-semibold">Auto-Renewal Protected</div>
          </div>
        </div>
      </div>

      {/* Available Tier Upgrades */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-black tracking-tight text-[#080512]">
              Explore Other Tiers
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Switch or upgrade your plan anytime. Prorated adjustments applied instantly.
            </p>
          </div>

          {/* Monthly / Annual Toggle */}
          <div className="flex items-center bg-neutral-100 p-1.5 rounded-2xl self-start">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                billingCycle === 'monthly' ? 'bg-white text-[#080512] shadow-sm' : 'text-neutral-500'
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                billingCycle === 'annual' ? 'bg-white text-[#080512] shadow-sm' : 'text-neutral-500'
              }`}
            >
              <span>Annual (Save 20%)</span>
              <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                Best Value
              </span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((p) => {
            const isCurrent = membership?.planId === p.id || membership?.planName.toLowerCase().includes(p.name.toLowerCase());
            const price = billingCycle === 'annual' ? p.annualPrice : p.monthlyPrice;

            return (
              <div
                key={p.id}
                className={`bg-white rounded-[32px] p-6 sm:p-8 border flex flex-col justify-between transition-all ${
                  isCurrent
                    ? 'border-purple-600 ring-2 ring-purple-600/20 shadow-xl'
                    : 'border-neutral-200/80 shadow-sm hover:shadow-md'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-black text-[#080512]">{p.name}</h3>
                    {isCurrent && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-purple-100 text-purple-800">
                        Current Tier
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-neutral-500 mb-6">{p.description}</p>

                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-3xl font-black text-[#080512]">${price}</span>
                    <span className="text-xs font-semibold text-neutral-400">/ month</span>
                  </div>

                  <div className="space-y-2.5 pt-4 border-t border-neutral-100 mb-6">
                    {p.features.map((f, i) => (
                      <div key={i} className="flex items-start gap-2.5 text-xs text-neutral-700">
                        <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => handleUpgrade(p.id, p.name)}
                  disabled={isCurrent || upgrading === p.id}
                  className={`w-full py-3.5 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    isCurrent
                      ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                      : 'bg-[#080512] text-white hover:bg-neutral-800 shadow-md'
                  }`}
                >
                  {upgrading === p.id ? (
                    <span>Processing Upgrade...</span>
                  ) : isCurrent ? (
                    <span>Current Active Plan</span>
                  ) : (
                    <>
                      <span>Upgrade to {p.name}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
