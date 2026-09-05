import React, { useState } from 'react';
import { PRICING_PLANS } from '../data/mockData';
import { PricingPlan } from '../types';
import { Check, X, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';

interface PricingSectionProps {
  onSelectPlan: (plan: PricingPlan) => void;
}

export const PricingSection: React.FC<PricingSectionProps> = ({ onSelectPlan }) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  return (
    <section id="pricing" className="w-full px-4 sm:px-6 lg:px-8 py-16 sm:py-24 bg-gradient-to-b from-[#F8F7FA] via-white to-[#F8F7FA] relative">
      <div className="max-w-7xl mx-auto">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-50 border border-purple-200/60 text-xs font-semibold text-purple-800 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span>Transparent Investment in Yourself</span>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#080512] tracking-tight mb-4">
            Membership Plans Built for Results
          </h2>
          <p className="text-base sm:text-lg text-neutral-600 leading-relaxed">
            No long-term lockout contracts, zero surprise maintenance fees, and complete freedom to pause anytime.
          </p>

          {/* Billing Cycle Toggle */}
          <div className="inline-flex items-center p-1 mt-8 bg-neutral-100 rounded-full border border-neutral-200/80">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-white text-[#080512] shadow-xs'
                  : 'text-neutral-600 hover:text-[#080512]'
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`flex items-center gap-1.5 px-5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all ${
                billingCycle === 'annual'
                  ? 'bg-white text-[#080512] shadow-xs'
                  : 'text-neutral-600 hover:text-[#080512]'
              }`}
            >
              <span>Annual Billing</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-100 text-purple-800">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* 3 Pricing Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch mb-16">
          {PRICING_PLANS.map((plan) => {
            const price = billingCycle === 'annual' ? plan.annualPrice : plan.monthlyPrice;
            const isPro = plan.isPopular;

            return (
              <div
                key={plan.id}
                className={`relative rounded-[32px] p-7 sm:p-9 flex flex-col justify-between transition-all duration-300 ${
                  isPro
                    ? 'bg-white border-2 border-purple-600 shadow-[0_20px_50px_-15px_rgba(109,40,217,0.18)] lg:-translate-y-2'
                    : 'bg-white/80 hover:bg-white border border-neutral-200/80 shadow-xs hover:shadow-lg'
                }`}
              >
                {/* Popular Pill */}
                {isPro && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md">
                      <Sparkles className="w-3.5 h-3.5" />
                      {plan.badge || 'Recommended Plan'}
                    </span>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-4">
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

                  {/* Price */}
                  <div className="flex items-baseline gap-1 mb-8 pb-6 border-b border-neutral-100">
                    <span className="text-4xl sm:text-5xl font-extrabold tracking-tight text-[#080512]">
                      {plan.currency}{price.toLocaleString('en-IN')}
                    </span>
                    <span className="text-xs sm:text-sm text-neutral-600 font-medium">
                      / month
                    </span>
                    {billingCycle === 'annual' && (
                      <span className="text-[10px] text-purple-700 font-bold ml-2">
                        billed annually
                      </span>
                    )}
                  </div>

                  {/* Features List */}
                  <div className="space-y-3 mb-8">
                    <div className="text-xs font-bold uppercase tracking-wider text-neutral-700 mb-2">
                      Included in this plan:
                    </div>
                    {plan.features.map((feature, i) => (
                      <div key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-neutral-700">
                        <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mt-0.5 shrink-0">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                        <span>{feature}</span>
                      </div>
                    ))}

                    {/* Excluded features if any */}
                    {plan.excludedFeatures?.map((exFeature, i) => (
                      <div key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-neutral-600 opacity-60">
                        <div className="w-4 h-4 rounded-full bg-neutral-100 text-neutral-600 flex items-center justify-center mt-0.5 shrink-0">
                          <X className="w-3 h-3" />
                        </div>
                        <span className="line-through">{exFeature}</span>
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
                  <span>Choose {plan.name}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Feature Comparison Table */}
        <div className="rounded-[28px] bg-white border border-neutral-200/80 p-6 sm:p-10 shadow-xs">
          <h3 className="text-xl font-bold text-[#080512] mb-6">Detailed Tier Comparison</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-neutral-200 text-neutral-600">
                  <th className="py-3 px-4 font-bold text-[#080512]">Feature / Amenity</th>
                  <th className="py-3 px-4 font-bold text-center">Basic (₹999)</th>
                  <th className="py-3 px-4 font-bold text-center text-purple-700">Pro (₹1,999)</th>
                  <th className="py-3 px-4 font-bold text-center">Elite (₹2,999)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                <tr>
                  <td className="py-3.5 px-4 font-medium text-neutral-800">Gym Floor & Strength Equipment</td>
                  <td className="py-3.5 px-4 text-center font-semibold text-emerald-600">Unlimited</td>
                  <td className="py-3.5 px-4 text-center font-semibold text-emerald-600">Unlimited</td>
                  <td className="py-3.5 px-4 text-center font-semibold text-emerald-600">Unlimited</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-medium text-neutral-800">IronCore Mobile & Workout Tracking</td>
                  <td className="py-3.5 px-4 text-center font-semibold text-emerald-600">Basic App</td>
                  <td className="py-3.5 px-4 text-center font-semibold text-purple-700">Full Pro Suite</td>
                  <td className="py-3.5 px-4 text-center font-semibold text-purple-700">Full Pro Suite</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-medium text-neutral-800">1-on-1 Master Coach Sessions</td>
                  <td className="py-3.5 px-4 text-center text-neutral-600">—</td>
                  <td className="py-3.5 px-4 text-center font-semibold text-neutral-800">2 / Month</td>
                  <td className="py-3.5 px-4 text-center font-bold text-purple-700">Unlimited</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-medium text-neutral-800">Infrared Sauna & Cold Plunge Spa</td>
                  <td className="py-3.5 px-4 text-center text-neutral-600">—</td>
                  <td className="py-3.5 px-4 text-center font-semibold text-emerald-600">Included</td>
                  <td className="py-3.5 px-4 text-center font-semibold text-emerald-600">Included (Priority)</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-medium text-neutral-800">Smart Macro & Nutrition Plan</td>
                  <td className="py-3.5 px-4 text-center text-neutral-600">—</td>
                  <td className="py-3.5 px-4 text-center font-semibold text-emerald-600">Included</td>
                  <td className="py-3.5 px-4 text-center font-semibold text-emerald-600">Included + Bloodwork</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-medium text-neutral-800">Bring a Guest Free</td>
                  <td className="py-3.5 px-4 text-center text-neutral-600">—</td>
                  <td className="py-3.5 px-4 text-center font-semibold text-neutral-800">2 Passes / Mo</td>
                  <td className="py-3.5 px-4 text-center font-semibold text-neutral-800">Unlimited Weekends</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="pt-6 mt-4 border-t border-neutral-100 flex flex-wrap items-center justify-between gap-4 text-xs text-neutral-600">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>14-day 100% money-back guarantee on all memberships.</span>
            </div>
            <div className="flex items-center gap-1 text-purple-700 font-semibold">
              <span>Corporate or group discount?</span>
              <a href="#contact" className="underline font-bold">Inquire here</a>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
