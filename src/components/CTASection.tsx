import React from 'react';
import { ArrowRight, Sparkles, ShieldCheck, Zap, HeartHandshake } from 'lucide-react';

interface CTASectionProps {
  onStartTrial: () => void;
}

export const CTASection: React.FC<CTASectionProps> = ({ onStartTrial }) => {
  return (
    <section className="w-full px-4 sm:px-6 lg:px-8 py-16 sm:py-24 relative overflow-hidden">
      <div className="max-w-7xl mx-auto">
        
        {/* Large Rounded Container with Purple/Pink Gradient Background */}
        <div className="relative rounded-[36px] sm:rounded-[44px] bg-gradient-to-br from-[#200e3b] via-[#3b1c6e] to-[#6d28d9] p-8 sm:p-14 lg:p-20 text-white overflow-hidden shadow-2xl">
          
          {/* Ambient Lighting & Glow Blobs */}
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-pink-500/30 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-purple-400/30 blur-3xl pointer-events-none" />
          <div className="absolute top-1/2 left-1/3 w-80 h-80 rounded-full bg-cyan-400/20 blur-3xl pointer-events-none" />

          {/* Subtle Background Fitness Graphic/Silhouette */}
          <div className="absolute right-0 top-0 bottom-0 w-full lg:w-1/2 opacity-15 pointer-events-none overflow-hidden flex items-center justify-end">
            <img
              src="https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1200&q=80"
              alt="Fitness Background"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover mix-blend-overlay"
            />
          </div>

          <div className="relative z-10 max-w-3xl">
            
            {/* Pill */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-semibold text-purple-200 mb-6 backdrop-blur-md">
              <Zap className="w-3.5 h-3.5 text-yellow-300" />
              <span>Instant Digital Access in 60 Seconds</span>
            </div>

            {/* Headline */}
            <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] mb-6">
              Your Strongest Version Starts Today.
            </h2>

            {/* Supporting Text */}
            <p className="text-base sm:text-xl text-purple-100/90 leading-relaxed font-normal mb-10 max-w-2xl">
              Join thousands of members building better habits, stronger bodies and healthier lives.
            </p>

            {/* Action CTA */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-10">
              <button
                onClick={onStartTrial}
                id="cta-start-free-trial-btn"
                className="group inline-flex items-center justify-center gap-3 px-9 py-4 rounded-full text-base font-bold text-[#080512] bg-white hover:bg-neutral-100 shadow-xl active:scale-[0.98] transition-all duration-200"
              >
                <span>Start Your Free Trial</span>
                <ArrowRight className="w-4 h-4 text-purple-700 group-hover:translate-x-1 transition-transform" />
              </button>

              <a
                href="#pricing"
                className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-full text-base font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-sm transition-colors"
              >
                <span>Compare All Plans</span>
              </a>
            </div>

            {/* Trust Perks */}
            <div className="pt-6 border-t border-white/15 flex flex-wrap items-center gap-6 sm:gap-10 text-xs sm:text-sm text-purple-200">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>14-day free trial</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-yellow-300" />
                <span>No credit card upfront</span>
              </div>
              <div className="flex items-center gap-2">
                <HeartHandshake className="w-4 h-4 text-cyan-300" />
                <span>Cancel anytime in-app</span>
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
