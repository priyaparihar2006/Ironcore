import React, { useState } from 'react';
import { X, CheckCircle, Sparkles, ArrowRight, Shield, QrCode } from 'lucide-react';
import { PricingPlan } from '../types';
import { PRICING_PLANS } from '../data/mockData';

interface TrialModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultPlan?: PricingPlan | null;
}

export const TrialModal: React.FC<TrialModalProps> = ({ isOpen, onClose, defaultPlan }) => {
  const [selectedPlanId, setSelectedPlanId] = useState<string>(defaultPlan?.id || 'pro');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [fitnessGoal, setFitnessGoal] = useState('Strength & Muscle Gain');
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
  };

  const handleResetAndClose = () => {
    setIsSubmitted(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-[32px] bg-white border border-neutral-200/80 p-6 sm:p-8 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={handleResetAndClose}
          className="absolute top-5 right-5 p-2 rounded-full text-neutral-600 hover:text-black hover:bg-neutral-100 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {!isSubmitted ? (
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 text-xs font-semibold text-purple-700 mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>14-Day Free Access Pass</span>
            </div>

            <h3 className="text-2xl font-bold text-[#080512] mb-1">
              Start Your IronCore Trial
            </h3>
            <p className="text-xs sm:text-sm text-neutral-600 mb-6">
              Experience the world-class facility, full biometric analytics, and training programs with zero commitment.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Plan Picker */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-2">
                  Select Preferred Tier
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {PRICING_PLANS.map((plan) => (
                    <button
                      type="button"
                      key={plan.id}
                      onClick={() => setSelectedPlanId(plan.id)}
                      className={`p-2.5 rounded-2xl border text-center transition-all ${
                        selectedPlanId === plan.id
                          ? 'border-purple-600 bg-purple-50/70 text-purple-950 font-bold shadow-xs'
                          : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                      }`}
                    >
                      <div className="text-xs font-bold">{plan.name}</div>
                      <div className="text-[11px] text-purple-700 font-extrabold">{plan.currency}{plan.monthlyPrice}/mo</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Liam Vance"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-xs sm:text-sm text-[#080512] focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white"
                />
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Work / Personal Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. liam@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-xs sm:text-sm text-[#080512] focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white"
                />
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Phone Number (for SMS Door Pass)
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. +91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-xs sm:text-sm text-[#080512] focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white"
                />
              </div>

              {/* Primary Goal */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Primary Fitness Goal
                </label>
                <select
                  value={fitnessGoal}
                  onChange={(e) => setFitnessGoal(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-xs sm:text-sm text-[#080512] focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white bg-white"
                >
                  <option>Strength & Heavy Compound Lifting</option>
                  <option>Lean Muscle Hypertrophy</option>
                  <option>Weight Loss & Conditioning</option>
                  <option>Athletic Agility & VO2 Max</option>
                  <option>Joint Mobility & Functional Health</option>
                </select>
              </div>

              {/* Submit CTA */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3.5 rounded-full bg-[#080512] hover:bg-neutral-800 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-md active:scale-[0.98] transition-all"
                >
                  <span>Activate 14-Day Free Pass</span>
                  <ArrowRight className="w-4 h-4 text-purple-300" />
                </button>
              </div>

              <div className="flex items-center justify-center gap-2 text-[11px] text-neutral-600 pt-1">
                <Shield className="w-3.5 h-3.5 text-emerald-600" />
                <span>Zero credit card required • Instant digital club barcode</span>
              </div>

            </form>
          </div>
        ) : (
          /* Confirmation State */
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8" />
            </div>

            <h3 className="text-2xl font-bold text-[#080512] mb-2">
              Pass Activated, {fullName.split(' ')[0] || 'Athlete'}!
            </h3>
            <p className="text-sm text-neutral-600 mb-6">
              Your 14-day pass to IronCore is ready. A welcome email and digital barcode have been dispatched to <strong>{email}</strong>.
            </p>

            {/* Mock Digital Badge */}
            <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 mb-6 max-w-xs mx-auto text-left">
              <div className="flex items-center justify-between text-xs font-bold text-neutral-700 pb-2 border-b border-neutral-200">
                <span>IRONCORE DIGITAL PASS</span>
                <span className="text-purple-700 uppercase">{selectedPlanId}</span>
              </div>
              <div className="pt-3 flex items-center gap-3">
                <div className="p-2 bg-white rounded-xl border border-neutral-200">
                  <QrCode className="w-10 h-10 text-[#080512]" />
                </div>
                <div className="text-xs">
                  <div className="font-bold text-[#080512]">{fullName || 'Verified Guest'}</div>
                  <div className="text-neutral-600 text-[11px]">Valid at Indiranagar Club</div>
                  <div className="text-emerald-700 font-semibold text-[10px]">Active for 14 Days</div>
                </div>
              </div>
            </div>

            <button
              onClick={handleResetAndClose}
              className="px-6 py-2.5 rounded-full bg-[#080512] text-white text-xs font-bold hover:bg-neutral-800 transition-colors"
            >
              Done & Return to Site
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
