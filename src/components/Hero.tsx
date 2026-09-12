import React from 'react';
import { HERO_ATHLETE_IMAGE } from '../data/mockData';

interface HeroProps {
  onJoinNow: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onJoinNow }) => {
  return (
    <div className="relative w-full overflow-hidden">
      {/* Background Soft Pastel Ambient Gradient Glow Blobs */}
      <div className="absolute top-[-100px] right-[-100px] w-[500px] lg:w-[600px] h-[500px] lg:h-[600px] bg-gradient-to-br from-purple-200/40 via-pink-100/40 to-transparent blur-[120px] rounded-full pointer-events-none -z-10" />
      <div className="absolute bottom-[-150px] left-[-100px] w-[600px] lg:w-[700px] h-[600px] lg:h-[700px] bg-gradient-to-tr from-cyan-100/30 via-yellow-50/40 to-transparent blur-[150px] rounded-full pointer-events-none -z-10" />

      {/* Main Hero Section */}
      <main className="w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 pt-4 sm:pt-6 pb-8 sm:pb-12 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-6 items-center relative z-10">
        
        {/* Left Column: Headlines, Value Prop, CTAs */}
        <div className="lg:col-span-6 flex flex-col justify-center pb-4 lg:pb-12">
          
          {/* Top Micro Badge */}
          <div className="mb-6">
            <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-purple-100 text-purple-700 text-xs font-bold uppercase tracking-wider">
              Premium Fitness Platform
            </span>
          </div>

          {/* Hero Editorial Headline */}
          <h1 className="font-display text-5xl sm:text-7xl lg:text-[84px] xl:text-[104px] font-black leading-[0.9] tracking-tighter mb-8 text-[#080512]">
            Move Better.<br />Live Better.
          </h1>

          {/* Supporting Text */}
          <p className="text-lg sm:text-xl text-[#080512]/60 max-w-md leading-relaxed mb-10 font-normal">
            Everything you need to manage your fitness journey, track your progress, and become your strongest self.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <button
              onClick={onJoinNow}
              id="hero-primary-cta"
              className="bg-[#080512] text-white px-8 sm:px-10 py-4 sm:py-5 rounded-2xl text-base sm:text-lg font-bold shadow-2xl shadow-purple-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 text-center"
            >
              Join Now
            </button>
            <a
              href="#programs"
              id="hero-secondary-cta"
              className="bg-white/80 border border-[#080512]/10 backdrop-blur-md px-8 sm:px-10 py-4 sm:py-5 rounded-2xl text-base sm:text-lg font-bold text-[#080512] hover:bg-white transition-all text-center"
            >
              Explore Programs
            </a>
          </div>

        </div>

        {/* Right Column: Hero Graphic with Pastel Backdrop Card & Metrics.
            Below `lg` there isn't reliably enough room for four independently
            floating cards not to collide, so they render as a plain, static
            2-col grid under the image instead (mobile AND tablet — a grid can
            never overlap by construction). At `lg`+ the original absolute
            floating composition — sized for the roughly fixed-width column
            that only exists once the layout splits into two columns — is
            preserved exactly as designed. */}
        <div className="lg:col-span-6 flex flex-col items-center justify-center gap-6 sm:gap-8">
          <div className="relative w-full max-w-[480px] sm:max-w-[540px] h-[520px] sm:h-[600px] flex items-center justify-center">

            {/* Pastel Inner Panel from Design */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] sm:w-[420px] h-[460px] sm:h-[550px] bg-gradient-to-b from-indigo-100 via-pink-100 to-cyan-50 rounded-[40px] shadow-inner" />

            {/* Athlete Imagery framed inside the rounded shape with soft fade */}
            <div className="absolute bottom-0 right-0 w-full h-full flex items-end justify-center overflow-hidden rounded-[40px]">
              <div className="w-full h-full relative flex items-end justify-center">
                <img
                  src={HERO_ATHLETE_IMAGE}
                  alt="Fit athletic trainer"
                  referrerPolicy="no-referrer"
                  className="relative z-10 w-auto h-[92%] sm:h-[95%] max-h-[570px] object-contain drop-shadow-xl"
                />
                <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#F8F7FA] via-transparent to-transparent z-15 pointer-events-none" />
              </div>
            </div>

            {/* Floating Metric 1: Calories (Top Left) — desktop/laptop only */}
            <div className="hidden lg:block absolute top-16 -left-8 bg-white/90 backdrop-blur-xl p-5 rounded-[24px] shadow-2xl border border-white/50 w-44 z-20 transition-transform hover:scale-105 duration-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center text-orange-500 text-xl">
                  🔥
                </div>
                <div className="text-xs font-bold text-gray-400 tracking-wider uppercase">
                  CALORIES
                </div>
              </div>
              <div className="text-2xl font-black text-[#080512]">
                1,200 <span className="text-xs font-bold opacity-40">kcal</span>
              </div>
            </div>

            {/* Floating Metric 2: Strength (Bottom Right) — desktop/laptop only */}
            <div className="hidden lg:block absolute bottom-28 -right-8 bg-white/90 backdrop-blur-xl p-5 rounded-[24px] shadow-2xl border border-white/50 w-44 z-20 transition-transform hover:scale-105 duration-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-500 text-xl">
                  🏋️
                </div>
                <div className="text-xs font-bold text-gray-400 tracking-wider uppercase">
                  STRENGTH
                </div>
              </div>
              <div className="text-2xl font-black text-[#080512]">
                +24% <span className="text-xs text-emerald-500 font-bold">↑</span>
              </div>
            </div>

            {/* Floating Metric 3: Daily Steps (Right Center) — desktop/laptop only */}
            <div className="hidden lg:flex absolute top-1/2 right-2 -translate-y-1/2 bg-white/90 backdrop-blur-xl p-4 rounded-2xl shadow-xl border border-white/50 items-center gap-4 z-20 transition-transform hover:scale-105 duration-200">
              <div className="w-2 h-10 bg-emerald-400 rounded-full" />
              <div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  DAILY STEPS
                </div>
                <div className="text-lg font-black text-[#080512]">
                  11,980
                </div>
              </div>
            </div>

            {/* Floating Metric 4: Weight (Bottom Left) — desktop/laptop only */}
            <div className="hidden lg:flex absolute bottom-8 left-6 bg-white/90 backdrop-blur-xl p-4 rounded-2xl shadow-xl border border-white/50 items-center gap-3 z-20 transition-transform hover:scale-105 duration-200">
              <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600 text-base">
                ⚖️
              </div>
              <div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  TARGET WEIGHT
                </div>
                <div className="text-base font-black text-[#080512]">
                  70 <span className="text-xs font-semibold opacity-40">kg</span>
                </div>
              </div>
            </div>

          </div>

          {/* Metric Grid — mobile & tablet only (below lg). Static, in normal
              document flow, so cards can never overlap each other or the
              image regardless of viewport width. */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 w-full max-w-[480px] sm:max-w-[540px] lg:hidden">

            {/* Calories */}
            <div className="w-full min-w-0 bg-white/90 backdrop-blur-xl p-3 sm:p-5 rounded-[24px] shadow-2xl border border-white/50 transition-transform hover:scale-105 duration-200">
              <div className="flex items-center gap-2 sm:gap-3 mb-2">
                <div className="w-8 h-8 sm:w-10 sm:h-10 shrink-0 bg-orange-100 rounded-xl flex items-center justify-center text-orange-500 text-lg sm:text-xl">
                  🔥
                </div>
                <div className="text-[10px] sm:text-xs font-bold text-gray-400 tracking-wider uppercase truncate">
                  CALORIES
                </div>
              </div>
              <div className="text-lg sm:text-2xl font-black text-[#080512] truncate">
                1,200 <span className="text-xs font-bold opacity-40">kcal</span>
              </div>
            </div>

            {/* Daily Steps */}
            <div className="w-full min-w-0 bg-white/90 backdrop-blur-xl p-3 sm:p-4 rounded-2xl shadow-xl border border-white/50 flex items-center gap-2.5 sm:gap-4 transition-transform hover:scale-105 duration-200">
              <div className="w-2 h-8 sm:h-10 shrink-0 bg-emerald-400 rounded-full" />
              <div className="min-w-0">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider truncate">
                  DAILY STEPS
                </div>
                <div className="text-sm sm:text-lg font-black text-[#080512] truncate">
                  11,980
                </div>
              </div>
            </div>

            {/* Strength */}
            <div className="w-full min-w-0 bg-white/90 backdrop-blur-xl p-3 sm:p-5 rounded-[24px] shadow-2xl border border-white/50 transition-transform hover:scale-105 duration-200">
              <div className="flex items-center gap-2 sm:gap-3 mb-2">
                <div className="w-8 h-8 sm:w-10 sm:h-10 shrink-0 bg-blue-100 rounded-xl flex items-center justify-center text-blue-500 text-lg sm:text-xl">
                  🏋️
                </div>
                <div className="text-[10px] sm:text-xs font-bold text-gray-400 tracking-wider uppercase truncate">
                  STRENGTH
                </div>
              </div>
              <div className="text-lg sm:text-2xl font-black text-[#080512] truncate">
                +24% <span className="text-xs text-emerald-500 font-bold">↑</span>
              </div>
            </div>

            {/* Target Weight */}
            <div className="w-full min-w-0 bg-white/90 backdrop-blur-xl p-3 sm:p-4 rounded-2xl shadow-xl border border-white/50 flex items-center gap-2.5 sm:gap-3 transition-transform hover:scale-105 duration-200">
              <div className="w-8 h-8 shrink-0 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600 text-base">
                ⚖️
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider truncate">
                  TARGET WEIGHT
                </div>
                <div className="text-sm sm:text-base font-black text-[#080512] truncate">
                  70 <span className="text-xs font-semibold opacity-40">kg</span>
                </div>
              </div>
            </div>

          </div>
        </div>

      </main>

      {/* Editorial Aesthetic 3-Card Status Section from Design HTML */}
      <section className="w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 pb-12 pt-4 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
          
          {/* Status Card 1: Workout Streak */}
          <div className="bg-white/60 backdrop-blur-lg border border-white p-6 rounded-[32px] flex items-center justify-between shadow-xs hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-600 rounded-2xl flex items-center justify-center text-white font-black text-sm tracking-tighter">
                IC
              </div>
              <div>
                <div className="text-sm font-bold text-[#080512]">Workout Streak</div>
                <div className="text-xs opacity-60 font-medium">12 Days Active</div>
              </div>
            </div>
            <div className="flex gap-1.5">
              <div className="w-7 h-7 rounded-lg bg-purple-600 shadow-2xs" />
              <div className="w-7 h-7 rounded-lg bg-purple-500 shadow-2xs" />
              <div className="w-7 h-7 rounded-lg bg-purple-400 shadow-2xs" />
              <div className="w-7 h-7 rounded-lg bg-purple-300 shadow-2xs" />
              <div className="w-7 h-7 rounded-lg bg-gray-100" />
            </div>
          </div>

          {/* Status Card 2: Hydration Level */}
          <div className="bg-white/60 backdrop-blur-lg border border-white p-6 rounded-[32px] flex items-center justify-between shadow-xs hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-cyan-500 rounded-2xl flex items-center justify-center text-white">
                <div className="w-6 h-1 bg-white rounded-full" />
              </div>
              <div>
                <div className="text-sm font-bold text-[#080512]">Hydration Level</div>
                <div className="text-xs opacity-60 font-medium">2.4L / 3.0L Target</div>
              </div>
            </div>
            <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="w-[80%] h-full bg-cyan-500 rounded-full" />
            </div>
          </div>

          {/* Status Card 3: Membership Status */}
          <div className="bg-[#080512] p-6 rounded-[32px] flex items-center justify-between text-white shadow-xl">
            <div>
              <div className="text-sm font-bold">Membership</div>
              <div className="text-xs opacity-60 text-purple-200">Elite Tier Plan</div>
            </div>
            <div className="bg-white/10 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase text-white/90">
              Active
            </div>
          </div>

        </div>
      </section>

    </div>
  );
};
