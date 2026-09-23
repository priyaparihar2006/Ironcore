import React, { useState } from 'react';
import { ACHIEVEMENTS } from '../data/mockData';
import { TrendingDown, TrendingUp, Trophy, Flame, Calendar, Award, CheckCircle2, Sparkles, ArrowRight } from 'lucide-react';

export const ProgressSection: React.FC = () => {
  const [activeTransformationTab, setActiveTransformationTab] = useState<'profile1' | 'profile2'>('profile1');
  const [sliderPosition, setSliderPosition] = useState<number>(50);

  const strengthMetrics = [
    { name: 'Barbell Back Squat', before: '100 kg', current: '145 kg', gain: '+45%', barWidth: '90%' },
    { name: 'Bench Press', before: '75 kg', current: '105 kg', gain: '+40%', barWidth: '82%' },
    { name: 'Conventional Deadlift', before: '130 kg', current: '185 kg', gain: '+42%', barWidth: '95%' },
    { name: 'Weighted Pull-Ups', before: 'Bodyweight (4 reps)', current: '+20 kg (8 reps)', gain: '+150%', barWidth: '78%' },
  ];

  // Consistency calendar mock: 12 weeks of 7 days
  const weeks = Array.from({ length: 14 });

  return (
    <section id="progress" className="w-full px-4 md:px-8 lg:px-12 py-16 sm:py-24 relative bg-white/60">
      <div className="max-w-7xl mx-auto">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--color-brand-bg)] border border-[var(--color-border-main)]/60 text-xs font-semibold text-purple-800 mb-3">
            <Trophy className="w-3.5 h-3.5 text-purple-600" />
            <span>Proven Biometric Transformations</span>
          </div>
          <h2 className="font-display text-3xl sm:text-3xl lg:text-5xl font-bold text-[var(--color-text-main)] tracking-tight mb-4">
            Quantifiable Physical Evolution
          </h2>
          <p className="text-base sm:text-lg text-neutral-600 leading-relaxed">
            Real progress isn't guesswork. Track your neuromuscular strength adaptations, body composition shifts, and habit consistency over time.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-12">
          
          {/* Left Column: Before/After Transformation Card & Biometrics (7 Cols) */}
          <div className="lg:col-span-7 rounded-[30px] bg-white border border-[var(--color-border-main)]/80 p-8 sm:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-main)] bg-[var(--color-brand-bg)] px-2.5 py-1 rounded-full">
                  Case Study: 6 Months Program
                </span>
                <h3 className="text-xl font-bold text-[var(--color-text-main)] mt-2">
                  Devan M. — Recomposition & Hypertrophy
                </h3>
              </div>

              {/* Toggle Switch */}
              <div className="inline-flex p-1 bg-neutral-100 rounded-full text-xs font-semibold">
                <button
                  onClick={() => setActiveTransformationTab('profile1')}
                  className={`px-3 py-1.5 rounded-full transition-all ${
                    activeTransformationTab === 'profile1' ? 'bg-white text-[var(--color-text-main)] shadow-xs' : 'text-neutral-600'
                  }`}
                >
                  Strength Split
                </button>
                <button
                  onClick={() => setActiveTransformationTab('profile2')}
                  className={`px-3 py-1.5 rounded-full transition-all ${
                    activeTransformationTab === 'profile2' ? 'bg-white text-[var(--color-text-main)] shadow-xs' : 'text-neutral-600'
                  }`}
                >
                  Fat Loss Cut
                </button>
              </div>
            </div>

            {/* Side-by-side or Interactive Comparison */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
              
              {/* Before State Card */}
              <div className="rounded-lg bg-[var(--color-brand-bg)] p-6 border border-[var(--color-border-main)]/70">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-600 bg-neutral-200 px-2 py-0.5 rounded-md">
                    MONTH 1 (START)
                  </span>
                  <span className="text-xs text-neutral-600">84.2 kg</span>
                </div>
                <div className="relative h-44 rounded-xl overflow-hidden bg-neutral-200 mb-3">
                  <img
                    src="https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=600&q=80"
                    alt="Starting conditioning"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover grayscale opacity-80"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-3">
                    <span className="text-white text-xs font-semibold">24.5% Body Fat</span>
                  </div>
                </div>
                <div className="space-y-1 text-xs text-neutral-600">
                  <div className="flex justify-between">
                    <span>Squat 1RM:</span>
                    <strong className="text-[var(--color-text-main)]">100 kg</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Resting Heart Rate:</span>
                    <strong className="text-[var(--color-text-main)]">74 bpm</strong>
                  </div>
                </div>
              </div>

              {/* After State Card (Highlighted) */}
              <div className="rounded-lg bg-gradient-to-br from-purple-50/60 via-white to-pink-50/50 p-6 border border-[var(--color-border-main)] shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-main)] bg-purple-100 px-2 py-0.5 rounded-md">
                    MONTH 6 (CURRENT)
                  </span>
                  <span className="text-xs font-bold text-[var(--color-text-main)]">70.4 kg (-13.8kg)</span>
                </div>
                <div className="relative h-44 rounded-xl overflow-hidden bg-neutral-900 mb-3">
                  <img
                    src="https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=600&q=80"
                    alt="Transformed physique"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end p-3 justify-between">
                    <span className="text-emerald-400 text-xs font-bold">12.8% Body Fat</span>
                    <span className="text-xs text-white bg-purple-600 px-2 py-0.5 rounded-full font-bold">+5.2kg Lean Mass</span>
                  </div>
                </div>
                <div className="space-y-1 text-xs text-neutral-600">
                  <div className="flex justify-between">
                    <span>Squat 1RM:</span>
                    <strong className="text-purple-950 font-bold">145 kg (+45%)</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Resting Heart Rate:</span>
                    <strong className="text-purple-950 font-bold">58 bpm (Athletic)</strong>
                  </div>
                </div>
              </div>

            </div>

            {/* Quick Summary Pill Bar */}
            <div className="p-3.5 rounded-lg bg-neutral-100/80 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-emerald-600" />
                <span className="text-neutral-700 font-medium">Waist Circumference: <strong className="text-[var(--color-text-main)]">-11 cm</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-purple-600" />
                <span className="text-neutral-700 font-medium">VO2 Max Score: <strong className="text-[var(--color-text-main)]">52 ml/kg/min (+14)</strong></span>
              </div>
              <div className="flex items-center gap-1 text-[var(--color-text-main)] font-bold">
                <span>Verified by DEXA Scan</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
              </div>
            </div>

          </div>

          {/* Right Column: Strength Progression & Weight Trajectory Chart (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Strength Progression Card */}
            <div className="rounded-[30px] bg-white border border-[var(--color-border-main)]/80 p-8 sm:p-7 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-[var(--color-text-main)]">Strength Progression</h3>
                <span className="text-xs font-bold text-[var(--color-text-main)] bg-[var(--color-brand-bg)] px-2.5 py-1 rounded-full">Compound PRs</span>
              </div>

              <div className="space-y-4">
                {strengthMetrics.map((metric, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-[var(--color-text-main)]">{metric.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-neutral-600 line-through text-xs">{metric.before}</span>
                        <span className="font-bold text-[var(--color-text-main)]">{metric.current}</span>
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded-sm">{metric.gain}</span>
                      </div>
                    </div>
                    <div className="w-full bg-neutral-100 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 h-2.5 rounded-full transition-all duration-500"
                        style={{ width: metric.barWidth }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Weight Progression Curve Visualization */}
            <div className="rounded-[30px] bg-white border border-[var(--color-border-main)]/80 p-8 sm:p-7 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-base font-bold text-[var(--color-text-main)]">Weight Progression Curve</h3>
                  <span className="text-xs text-neutral-600">Weekly weigh-in averages</span>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-[var(--color-text-main)]">70.0 kg</span>
                  <span className="text-xs block text-emerald-600 font-bold">Target Reached!</span>
                </div>
              </div>

              {/* Graphic Chart */}
              <div className="h-32 w-full pt-4">
                <svg className="w-full h-full" viewBox="0 0 300 80">
                  {/* Grid Lines */}
                  <line x1="0" y1="20" x2="300" y2="20" stroke="#F3F4F6" strokeDasharray="4 4" />
                  <line x1="0" y1="50" x2="300" y2="50" stroke="#F3F4F6" strokeDasharray="4 4" />
                  
                  {/* Target Goal Line */}
                  <line x1="0" y1="65" x2="300" y2="65" stroke="#DDD6FE" strokeWidth="1.5" strokeDasharray="3 3" />
                  <text x="5" y="62" fill="#7C3AED" fontSize="8" fontWeight="bold">TARGET GOAL: 70kg</text>

                  {/* Smooth Descent Curve */}
                  <path
                    d="M 10 15 C 60 22, 100 35, 150 42 C 200 48, 250 58, 290 65"
                    fill="none"
                    stroke="#7C3AED"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />

                  {/* Data Points */}
                  <circle cx="10" cy="15" r="4" fill="#080512" />
                  <circle cx="90" cy="28" r="4" fill="#7C3AED" />
                  <circle cx="170" cy="45" r="4" fill="#7C3AED" />
                  <circle cx="290" cy="65" r="5" fill="#10B981" stroke="#FFFFFF" strokeWidth="2" />
                </svg>
                <div className="flex justify-between text-xs text-neutral-600 font-medium pt-1 px-1">
                  <span>Wk 1 (84.2kg)</span>
                  <span>Wk 8 (79.0kg)</span>
                  <span>Wk 16 (74.1kg)</span>
                  <span className="text-emerald-700 font-bold">Wk 24 (70.0kg)</span>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* Workout Consistency Heatmap & Monthly Achievements Row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Consistency Heatmap (7 Cols) */}
          <div className="lg:col-span-7 rounded-[30px] bg-white border border-[var(--color-border-main)]/80 p-8 sm:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div>
                <h3 className="text-lg font-bold text-[var(--color-text-main)] flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-purple-600" />
                  Workout Consistency Matrix
                </h3>
                <p className="text-xs text-neutral-600">
                  98 sessions completed across the last 14 weeks (91% adherence rate)
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-neutral-600 text-xs">Less</span>
                <span className="w-3 h-3 rounded-xs bg-neutral-100" />
                <span className="w-3 h-3 rounded-xs bg-purple-200" />
                <span className="w-3 h-3 rounded-xs bg-purple-400" />
                <span className="w-3 h-3 rounded-xs bg-purple-700" />
                <span className="text-neutral-600 text-xs">More</span>
              </div>
            </div>

            {/* Heatmap Grid */}
            <div className="grid grid-cols-14 gap-1.5 sm:gap-2">
              {weeks.map((_, weekIdx) => (
                <div key={weekIdx} className="flex flex-col gap-1.5">
                  {Array.from({ length: 7 }).map((_, dayIdx) => {
                    // Semi-randomized active training days
                    const activeSeed = (weekIdx * 7 + dayIdx * 3) % 10;
                    let bg = 'bg-neutral-100';
                    if (activeSeed > 7) bg = 'bg-purple-700';
                    else if (activeSeed > 4) bg = 'bg-[var(--color-brand-bg)]0';
                    else if (activeSeed > 2) bg = 'bg-purple-300';

                    return (
                      <div
                        key={dayIdx}
                        className={`w-full aspect-square rounded-xs sm:rounded-sm transition-transform hover:scale-125 ${bg}`}
                        title={`Week ${weekIdx + 1}, Day ${dayIdx + 1}`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-between pt-4 mt-4 border-t border-neutral-100 text-xs text-neutral-600">
              <span className="flex items-center gap-1 font-semibold text-[var(--color-text-main)]">
                <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
                Current Streak: 18 Days
              </span>
              <span>Longest Streak: 42 Days</span>
              <span className="text-[var(--color-text-main)] font-bold">Top 5% Most Consistent in Club</span>
            </div>
          </div>

          {/* Monthly Achievements Badges (5 Cols) */}
          <div className="lg:col-span-5 rounded-[30px] bg-white border border-[var(--color-border-main)]/80 p-8 sm:p-8 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-[var(--color-text-main)] flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-500" />
                  Monthly Achievements
                </h3>
                <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full">
                  4 Unlocked
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {ACHIEVEMENTS.map((ach) => (
                  <div
                    key={ach.id}
                    className="p-3.5 rounded-lg bg-[var(--color-brand-bg)] hover:bg-[var(--color-brand-bg)]/50 border border-[var(--color-border-main)]/70 transition-colors flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                        <Trophy className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white text-neutral-700 border border-[var(--color-border-main)]">
                        {ach.level}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[var(--color-text-main)] leading-tight mb-1">{ach.title}</h4>
                      <p className="text-xs text-neutral-600 leading-snug">{ach.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-neutral-100 flex items-center justify-between text-xs">
              <span className="text-neutral-600">Next unlock: <strong>200kg Deadlift Milestone</strong></span>
              <span className="text-[var(--color-text-main)] font-bold">85% Complete</span>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
