import React, { useState } from 'react';
import { PRICING_PLANS } from '../data/mockData';
import { PricingPlan } from '../types';
import { Check, X, Sparkles, ArrowRight, ShieldCheck, Zap, Award, HelpCircle } from 'lucide-react';

interface PricingSectionProps {
  onSelectPlan: (plan: PricingPlan) => void;
}

type BillingCycle = 'monthly' | 'semi-annual' | 'annual';

export const PricingSection: React.FC<PricingSectionProps> = ({ onSelectPlan }) => {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');

  const getPlanPrice = (plan: PricingPlan): number => {
    if (billingCycle === 'annual') return plan.annualPrice;
    if (billingCycle === 'semi-annual') return plan.semiAnnualPrice ?? Math.round(plan.monthlyPrice * 0.9);
    return plan.monthlyPrice;
  };

  const getBillingSubtext = (plan: PricingPlan): string => {
    const price = getPlanPrice(plan);
    if (billingCycle === 'annual') {
      const total = price * 12;
      return `₹${total.toLocaleString('en-IN')} total billed annually (Save 20%)`;
    }
    if (billingCycle === 'semi-annual') {
      const total = price * 6;
      return `₹${total.toLocaleString('en-IN')} total billed every 6 months (Save 10%)`;
    }
    return 'Billed monthly • Complete flexibility to pause anytime';
  };

  const basicPlan = PRICING_PLANS.find((p) => p.id === 'basic') || PRICING_PLANS[0];
  const proPlan = PRICING_PLANS.find((p) => p.id === 'pro') || PRICING_PLANS[1];
  const elitePlan = PRICING_PLANS.find((p) => p.id === 'elite') || PRICING_PLANS[2];

  return (
    <section id="pricing" className="w-full px-4 sm:px-6 lg:px-8 py-16 sm:py-24 bg-gradient-to-b from-[#F8F7FA] via-white to-[#F8F7FA] relative">
      <div className="max-w-7xl mx-auto">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-50 border border-purple-200/60 text-xs font-semibold text-purple-800 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span>IronCore Membership Plans</span>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#080512] tracking-tight mb-4">
            Transparent Pricing Built for Results
          </h2>
          <p className="text-base sm:text-lg text-neutral-600 leading-relaxed">
            Three tailored membership tiers for individual gym members, performance-focused athletes, and premium clients.
          </p>

          {/* 3-Way Billing Cycle Toggle: 1 Month, 6 Months, Annual */}
          <div className="inline-flex flex-wrap items-center justify-center p-1.5 mt-8 bg-neutral-100/90 rounded-2xl sm:rounded-full border border-neutral-200/80 shadow-inner gap-1">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 sm:px-5 py-2.5 rounded-xl sm:rounded-full text-xs sm:text-sm font-bold transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-white text-[#080512] shadow-sm'
                  : 'text-neutral-600 hover:text-[#080512]'
              }`}
            >
              1 Month
            </button>
            <button
              onClick={() => setBillingCycle('semi-annual')}
              className={`flex items-center gap-1.5 px-4 sm:px-5 py-2.5 rounded-xl sm:rounded-full text-xs sm:text-sm font-bold transition-all ${
                billingCycle === 'semi-annual'
                  ? 'bg-white text-[#080512] shadow-sm'
                  : 'text-neutral-600 hover:text-[#080512]'
              }`}
            >
              <span>6 Months</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800">
                Save 10%
              </span>
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`flex items-center gap-1.5 px-4 sm:px-5 py-2.5 rounded-xl sm:rounded-full text-xs sm:text-sm font-bold transition-all ${
                billingCycle === 'annual'
                  ? 'bg-white text-[#080512] shadow-sm'
                  : 'text-neutral-600 hover:text-[#080512]'
              }`}
            >
              <span>Annual (12 Months)</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* 3 Pricing Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch mb-16">
          {PRICING_PLANS.map((plan) => {
            const price = getPlanPrice(plan);
            const isPro = plan.isPopular;
            const hasDiscount = billingCycle !== 'monthly';

            return (
              <div
                key={plan.id}
                className={`relative rounded-[32px] p-7 sm:p-9 flex flex-col justify-between transition-all duration-300 ${
                  isPro
                    ? 'bg-white border-2 border-purple-600 shadow-[0_20px_50px_-15px_rgba(109,40,217,0.18)] lg:-translate-y-2'
                    : 'bg-white/85 hover:bg-white border border-neutral-200/80 shadow-xs hover:shadow-lg'
                }`}
              >
                {/* Popular Pill */}
                {isPro && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md">
                      <Sparkles className="w-3.5 h-3.5" />
                      {plan.badge || 'Most Popular'}
                    </span>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-2xl font-bold text-[#080512]">{plan.name}</h3>
                    {!isPro && plan.badge && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-700">
                        {plan.badge}
                      </span>
                    )}
                  </div>

                  <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed mb-6">
                    {plan.description}
                  </p>

                  {/* Price Header */}
                  <div className="mb-6 pb-6 border-b border-neutral-100">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl sm:text-5xl font-extrabold tracking-tight text-[#080512]">
                        {plan.currency}{price.toLocaleString('en-IN')}
                      </span>
                      <span className="text-xs sm:text-sm text-neutral-600 font-medium">
                        / month
                      </span>

                      {/* Strikethrough monthly price if on discount */}
                      {hasDiscount && (
                        <span className="text-xs sm:text-sm text-neutral-400 line-through font-semibold ml-1">
                          {plan.currency}{plan.monthlyPrice}
                        </span>
                      )}
                    </div>

                    {/* Total Billing Subtext */}
                    <div className="mt-2 text-xs font-semibold text-purple-700">
                      {getBillingSubtext(plan)}
                    </div>
                  </div>

                  {/* Features List */}
                  <div className="space-y-3 mb-8">
                    <div className="text-xs font-bold uppercase tracking-wider text-neutral-700 mb-2">
                      Plan Inclusions:
                    </div>
                    {plan.features.map((feature, i) => (
                      <div key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-neutral-700">
                        <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mt-0.5 shrink-0">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                        <span className="leading-snug">{feature}</span>
                      </div>
                    ))}

                    {/* Excluded features if any */}
                    {plan.excludedFeatures?.map((exFeature, i) => (
                      <div key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-neutral-400 opacity-60">
                        <div className="w-4 h-4 rounded-full bg-neutral-100 text-neutral-400 flex items-center justify-center mt-0.5 shrink-0">
                          <X className="w-3 h-3" />
                        </div>
                        <span className="line-through leading-snug">{exFeature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Card CTA */}
                <button
                  onClick={() => onSelectPlan(plan)}
                  className={`w-full py-4 rounded-full text-sm font-bold flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98] ${
                    isPro
                      ? 'bg-[#080512] hover:bg-neutral-800 text-white shadow-md shadow-purple-950/20'
                      : 'bg-neutral-100 hover:bg-[#080512] hover:text-white text-[#080512]'
                  }`}
                >
                  <span>Select {plan.name}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Feature Comparison Table */}
        <div className="rounded-[28px] bg-white border border-neutral-200/80 p-6 sm:p-10 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-xl font-bold text-[#080512]">Comprehensive Tier Comparison</h3>
              <p className="text-xs text-neutral-500 mt-1">
                Side-by-side feature and amenity breakdown across all membership tiers.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full bg-neutral-100 text-neutral-700 w-fit">
              <Zap className="w-3.5 h-3.5 text-purple-600" />
              <span>Prices shown for {billingCycle === 'annual' ? 'Annual (Save 20%)' : billingCycle === 'semi-annual' ? '6 Months (Save 10%)' : 'Monthly'} billing</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-neutral-200 text-neutral-600">
                  <th className="py-3.5 px-4 font-bold text-[#080512] min-w-[240px]">Feature / Amenity</th>
                  <th className="py-3.5 px-4 font-bold text-center min-w-[140px]">
                    <div>{basicPlan.name}</div>
                    <div className="text-xs font-semibold text-neutral-500 font-mono mt-0.5">
                      ₹{getPlanPrice(basicPlan)}/mo
                    </div>
                  </th>
                  <th className="py-3.5 px-4 font-bold text-center text-purple-700 min-w-[140px] bg-purple-50/50 rounded-t-xl">
                    <div>{proPlan.name}</div>
                    <div className="text-xs font-bold text-purple-700 font-mono mt-0.5">
                      ₹{getPlanPrice(proPlan)}/mo
                    </div>
                  </th>
                  <th className="py-3.5 px-4 font-bold text-center min-w-[140px]">
                    <div>{elitePlan.name}</div>
                    <div className="text-xs font-semibold text-neutral-500 font-mono mt-0.5">
                      ₹{getPlanPrice(elitePlan)}/mo
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                <tr>
                  <td className="py-3.5 px-4 font-medium text-neutral-800">Gym Floor & Equipment Access</td>
                  <td className="py-3.5 px-4 text-center font-semibold text-emerald-600">Full Access</td>
                  <td className="py-3.5 px-4 text-center font-semibold text-emerald-600 bg-purple-50/30">Full Access</td>
                  <td className="py-3.5 px-4 text-center font-semibold text-emerald-600">Full Access</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-medium text-neutral-800">IronCore Mobile Workout Logging App</td>
                  <td className="py-3.5 px-4 text-center font-semibold text-emerald-600">Included</td>
                  <td className="py-3.5 px-4 text-center font-semibold text-emerald-600 bg-purple-50/30">Included</td>
                  <td className="py-3.5 px-4 text-center font-semibold text-emerald-600">Included</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-medium text-neutral-800">Contactless QR Gym Check-in</td>
                  <td className="py-3.5 px-4 text-center font-semibold text-emerald-600">Included</td>
                  <td className="py-3.5 px-4 text-center font-semibold text-emerald-600 bg-purple-50/30">Included</td>
                  <td className="py-3.5 px-4 text-center font-semibold text-emerald-600">Included</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-medium text-neutral-800">Locker Room & Standard Shower Access</td>
                  <td className="py-3.5 px-4 text-center font-semibold text-emerald-600">Included</td>
                  <td className="py-3.5 px-4 text-center font-semibold text-emerald-600 bg-purple-50/30">Included</td>
                  <td className="py-3.5 px-4 text-center font-semibold text-emerald-600">Included</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-medium text-neutral-800">Basic Progress Metrics & Bodyweight Chart</td>
                  <td className="py-3.5 px-4 text-center font-semibold text-emerald-600">Standard</td>
                  <td className="py-3.5 px-4 text-center font-semibold text-purple-700 bg-purple-50/30">Advanced Suite</td>
                  <td className="py-3.5 px-4 text-center font-semibold text-purple-700">Full Biometrics</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-medium text-neutral-800">Unlimited Access to All 6 Workout Programs</td>
                  <td className="py-3.5 px-4 text-center text-neutral-400">—</td>
                  <td className="py-3.5 px-4 text-center font-semibold text-emerald-600 bg-purple-50/30">Unlimited</td>
                  <td className="py-3.5 px-4 text-center font-semibold text-emerald-600">Unlimited</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-medium text-neutral-800">Advanced 1RM & Volume Analytics Dashboard</td>
                  <td className="py-3.5 px-4 text-center text-neutral-400">—</td>
                  <td className="py-3.5 px-4 text-center font-semibold text-emerald-600 bg-purple-50/30">Included</td>
                  <td className="py-3.5 px-4 text-center font-semibold text-emerald-600">Included</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-medium text-neutral-800">Full Nutrition Tracking & Daily Macro Coaching</td>
                  <td className="py-3.5 px-4 text-center text-neutral-400">—</td>
                  <td className="py-3.5 px-4 text-center font-semibold text-emerald-600 bg-purple-50/30">Included</td>
                  <td className="py-3.5 px-4 text-center font-semibold text-emerald-600">Included</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-medium text-neutral-800">1-on-1 Personal Trainer Sessions</td>
                  <td className="py-3.5 px-4 text-center text-neutral-400">—</td>
                  <td className="py-3.5 px-4 text-center font-semibold text-neutral-800 bg-purple-50/30">2 / Month</td>
                  <td className="py-3.5 px-4 text-center font-bold text-purple-700">Unlimited</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-medium text-neutral-800">Unlimited Infrared Sauna & Cold Plunge Access</td>
                  <td className="py-3.5 px-4 text-center text-neutral-400">—</td>
                  <td className="py-3.5 px-4 text-center font-semibold text-emerald-600 bg-purple-50/30">Included</td>
                  <td className="py-3.5 px-4 text-center font-semibold text-emerald-600">Included (Priority)</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-medium text-neutral-800">Bring a Guest Free Privileges</td>
                  <td className="py-3.5 px-4 text-center text-neutral-400">—</td>
                  <td className="py-3.5 px-4 text-center font-semibold text-neutral-800 bg-purple-50/30">2 Times / Month</td>
                  <td className="py-3.5 px-4 text-center font-semibold text-neutral-800">Unlimited Weekends</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-medium text-neutral-800">Weekly Customized Bloodwork & Bio-metric Review</td>
                  <td className="py-3.5 px-4 text-center text-neutral-400">—</td>
                  <td className="py-3.5 px-4 text-center text-neutral-400 bg-purple-50/30">—</td>
                  <td className="py-3.5 px-4 text-center font-bold text-purple-700">Included Weekly</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-medium text-neutral-800">Reserved Private Executive Locker & Laundry Service</td>
                  <td className="py-3.5 px-4 text-center text-neutral-400">—</td>
                  <td className="py-3.5 px-4 text-center text-neutral-400 bg-purple-50/30">—</td>
                  <td className="py-3.5 px-4 text-center font-bold text-purple-700">Dedicated Locker</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-medium text-neutral-800">Daily Complimentary Pre-workout & Whey Shake Bar</td>
                  <td className="py-3.5 px-4 text-center text-neutral-400">—</td>
                  <td className="py-3.5 px-4 text-center text-neutral-400 bg-purple-50/30">—</td>
                  <td className="py-3.5 px-4 text-center font-bold text-purple-700">Daily Fuel Included</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-medium text-neutral-800">24/7 Direct WhatsApp Concierge with Head Coach</td>
                  <td className="py-3.5 px-4 text-center text-neutral-400">—</td>
                  <td className="py-3.5 px-4 text-center text-neutral-400 bg-purple-50/30">—</td>
                  <td className="py-3.5 px-4 text-center font-bold text-purple-700">24/7 Dedicated Line</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-medium text-neutral-800">Unlimited Multi-city IronCore Club Roaming</td>
                  <td className="py-3.5 px-4 text-center text-neutral-400">—</td>
                  <td className="py-3.5 px-4 text-center text-neutral-400 bg-purple-50/30">—</td>
                  <td className="py-3.5 px-4 text-center font-bold text-purple-700">All Locations</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Pricing Footnote & Guarantee */}
          <div className="pt-6 mt-6 border-t border-neutral-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-neutral-600">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>14-day 100% money-back guarantee on all memberships. Zero risk to start.</span>
            </div>
            <div className="text-[11px] text-neutral-500 italic">
              * Annual and 6-month figures are calculated as monthly-equivalent prices; totals are charged according to cycle duration.
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
