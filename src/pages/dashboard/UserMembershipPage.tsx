import React, { useEffect, useState } from 'react';
import { Check, ShieldCheck, Sparkles, AlertCircle, ArrowRight, CheckCircle2, CreditCard } from 'lucide-react';
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

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: 'text-emerald-400',
  EXPIRED: 'text-amber-400',
  CANCELLED: 'text-red-400',
  PENDING: 'text-purple-300',
};

export const UserMembershipPage: React.FC = () => {
  const [membership, setMembership] = useState<UserMembershipData | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchMembership = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiRequest<{ membership: UserMembershipData | null; plans: Plan[] }>(
        '/user/membership'
      );
      setMembership(res.membership ?? null);
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
      setActionError(null);
      await apiRequest('/user/membership/upgrade', {
        method: 'POST',
        body: JSON.stringify({ planId, billingCycle }),
      });
      setSuccessToast(`Plan successfully updated to ${planName}!`);
      await fetchMembership();
      setTimeout(() => setSuccessToast(null), 4000);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not update your plan. Please try again.');
      setTimeout(() => setActionError(null), 5000);
    } finally {
      setUpgrading(null);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  // An ACTIVE record whose expiry date has passed is effectively expired.
  const isExpired =
    !!membership &&
    (membership.status === 'EXPIRED' ||
      (membership.status === 'ACTIVE' && membership.expiryDate < todayStr));
  const effectiveStatus = !membership
    ? 'NONE'
    : isExpired
    ? 'EXPIRED'
    : membership.status;

  const daysRemaining = membership
    ? Math.ceil(
        (new Date(membership.expiryDate).getTime() - new Date(todayStr).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : 0;

  const hasUsablePlan = !!membership && effectiveStatus === 'ACTIVE';

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-neutral-200 rounded-xl w-64"></div>
        <div className="h-64 bg-neutral-200 rounded-3xl"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 rounded-3xl bg-red-50 border border-red-200 text-red-700 flex flex-col items-center text-center">
        <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
        <h2 className="text-lg font-bold">Failed to load membership</h2>
        <p className="text-sm text-red-600 mb-4">{error}</p>
        <button
          onClick={fetchMembership}
          className="px-6 py-2 rounded-xl bg-red-600 text-white text-xs font-bold"
        >
          Retry
        </button>
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
      {actionError && (
        <div className="fixed top-6 right-6 z-50 bg-red-600 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-fade-in">
          <AlertCircle className="w-5 h-5" />
          <span className="text-sm font-bold">{actionError}</span>
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

      {membership ? (
        /* Current Plan Hero Card */
        <div className="bg-gradient-to-br from-[#080512] via-[#1a122e] to-[#2e1a50] text-white rounded-[32px] p-6 sm:p-8 relative overflow-hidden shadow-2xl shadow-purple-950/10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-purple-200 text-xs font-bold uppercase tracking-wider mb-3">
                <ShieldCheck className={`w-3.5 h-3.5 ${STATUS_STYLES[effectiveStatus] || 'text-white'}`} />
                Status: {effectiveStatus}
              </div>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tighter text-white">
                {membership.planName} Member
              </h2>
              <p className="text-white/70 text-xs sm:text-sm mt-1 max-w-md">
                Full facility access, personal training credits, recovery suite, and digital workout synchronizer.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/10 text-xs">
                <div>
                  <span className="text-white/50 block">Start Date</span>
                  <span className="font-bold text-white mt-0.5 block">{membership.startDate}</span>
                </div>
                <div>
                  <span className="text-white/50 block">Renewal / Expiry</span>
                  <span className="font-bold text-white mt-0.5 block">
                    {membership.expiryDate}
                    <span className="text-white/50 font-medium ml-1">
                      {isExpired
                        ? '(expired)'
                        : daysRemaining >= 0
                        ? `(${daysRemaining} day${daysRemaining === 1 ? '' : 's'} left)`
                        : ''}
                    </span>
                  </span>
                </div>
                <div>
                  <span className="text-white/50 block">Billing Cycle</span>
                  <span className="font-bold text-emerald-400 mt-0.5 block capitalize">
                    ${membership.pricePaid} / {membership.billingCycle}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 flex flex-col items-center justify-center text-center self-stretch md:self-auto min-w-[200px]">
              <Sparkles className="w-8 h-8 text-purple-300 mb-2" />
              <div className="text-xs font-bold text-white/70">Auto-Renewal</div>
              <div className="text-sm font-black text-white mt-0.5">
                {membership.autoRenew ? 'Enabled' : 'Disabled'}
              </div>
              <div className="text-[10px] text-emerald-400 mt-1 font-semibold capitalize">
                {membership.billingCycle} billing
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* No membership on record */
        <div className="bg-white rounded-[32px] p-8 sm:p-10 border border-neutral-200/80 shadow-sm flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
            <CreditCard className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-black text-[#080512]">No active membership</h2>
          <p className="text-xs text-neutral-500 max-w-sm mt-1.5">
            You don't have a membership on record yet. Choose one of the tiers below to unlock full
            facility access and coaching.
          </p>
        </div>
      )}

      {/* Available Tier Upgrades */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-black tracking-tight text-[#080512]">
              {membership ? 'Explore Other Tiers' : 'Choose a Plan'}
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

        {plans.length === 0 ? (
          <div className="p-10 rounded-[32px] bg-white border border-neutral-200/80 text-center text-sm text-neutral-500">
            No membership plans are available right now.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((p) => {
              const isCurrent =
                hasUsablePlan &&
                (membership!.planId === p.id ||
                  membership!.planName.toLowerCase().includes(p.name.toLowerCase()));
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
                      <span className="text-xs font-semibold text-neutral-400">
                        / {billingCycle === 'annual' ? 'month, billed annually' : 'month'}
                      </span>
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
                      <span>Processing...</span>
                    ) : isCurrent ? (
                      <span>Current Active Plan</span>
                    ) : (
                      <>
                        <span>{membership ? `Switch to ${p.name}` : `Select ${p.name}`}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
