import React, { useState } from 'react';
import { Flame, Dumbbell, Footprints, Scale, Trophy, CheckCircle, Calendar, ArrowUpRight, BarChart3, Clock, Sparkles, UserCheck, Shield, ChevronRight } from 'lucide-react';

export const DashboardPreview: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'activity' | 'vitals'>('overview');
  const [streakCount, setStreakCount] = useState(18);
  const [hasCheckedIn, setHasCheckedIn] = useState(false);
  const [selectedDay, setSelectedDay] = useState<'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun'>('Thu');

  const weeklyData = [
    { day: 'Mon', calories: 650, intensity: 85, completed: true },
    { day: 'Tue', calories: 820, intensity: 95, completed: true },
    { day: 'Wed', calories: 540, intensity: 70, completed: true },
    { day: 'Thu', calories: 920, intensity: 98, completed: true },
    { day: 'Fri', calories: 710, intensity: 80, completed: false },
    { day: 'Sat', calories: 890, intensity: 90, completed: false },
    { day: 'Sun', calories: 400, intensity: 50, completed: false },
  ];

  const handleCheckIn = () => {
    if (!hasCheckedIn) {
      setStreakCount(prev => prev + 1);
      setHasCheckedIn(true);
    }
  };

  return (
    <section id="dashboard" className="w-full px-4 sm:px-6 lg:px-8 py-16 sm:py-24 bg-white/50 relative">
      <div className="max-w-7xl mx-auto">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-50 border border-purple-200/60 text-xs font-semibold text-purple-800 mb-4">
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span>Unified Platform Experience</span>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#080512] tracking-tight mb-4">
            Your Fitness Operating System
          </h2>
          <p className="text-base sm:text-lg text-neutral-600 leading-relaxed">
            Monitor real-time training analytics, biometric feedback, nutrition pacing, and club access from a single high-performance dashboard.
          </p>

          {/* Interactive Tab Switcher */}
          <div className="inline-flex items-center p-1.5 mt-8 bg-neutral-100 rounded-full border border-neutral-200/80">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all duration-150 ${
                activeTab === 'overview'
                  ? 'bg-white text-[#080512] shadow-xs'
                  : 'text-neutral-600 hover:text-[#080512]'
              }`}
            >
              Live Telemetry
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              className={`px-5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all duration-150 ${
                activeTab === 'activity'
                  ? 'bg-white text-[#080512] shadow-xs'
                  : 'text-neutral-600 hover:text-[#080512]'
              }`}
            >
              Weekly Load
            </button>
            <button
              onClick={() => setActiveTab('vitals')}
              className={`px-5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all duration-150 ${
                activeTab === 'vitals'
                  ? 'bg-white text-[#080512] shadow-xs'
                  : 'text-neutral-600 hover:text-[#080512]'
              }`}
            >
              Body Metrics
            </button>
          </div>
        </div>

        {/* Dashboard Canvas Container */}
        <div className="relative rounded-[30px] border border-neutral-200/80 bg-gradient-to-b from-[#FAF9FD] to-[#FFFFFF] p-5 sm:p-8 lg:p-10 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]">
          
          {/* Top Bar inside Dashboard */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 mb-8 border-b border-neutral-200/70">
            <div className="flex items-center gap-3.5">
              <div className="relative">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&h=120&q=80"
                  alt="Athlete"
                  referrerPolicy="no-referrer"
                  className="w-12 h-12 rounded-2xl object-cover border-2 border-white shadow-xs"
                />
                <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-[#080512]">Siddharth V.</h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700">PRO MEMBER</span>
                </div>
                <p className="text-xs text-neutral-600">IronCore Hub: Indiranagar Flagship • Locker #42</p>
              </div>
            </div>

            {/* Quick Action Interactive Streak & Check-in */}
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-amber-50 border border-amber-200/60 text-amber-900">
                <Flame className="w-5 h-5 text-amber-500 fill-amber-500" />
                <div className="text-left">
                  <div className="text-xs font-bold leading-tight">{streakCount} Days</div>
                  <div className="text-[10px] text-amber-700 font-medium">Active Streak</div>
                </div>
              </div>

              <button
                onClick={handleCheckIn}
                disabled={hasCheckedIn}
                className={`flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-semibold transition-all ${
                  hasCheckedIn
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 cursor-default'
                    : 'bg-[#080512] text-white hover:bg-neutral-800 active:scale-95 shadow-xs'
                }`}
              >
                {hasCheckedIn ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>Checked In Today!</span>
                  </>
                ) : (
                  <>
                    <Calendar className="w-4 h-4 text-purple-300" />
                    <span>Log Daily Attendance</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Grid Layout of Dashboard Modules */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 lg:gap-6">
            
            {/* 1. Daily Calories & Nutrition Card (4 Cols) */}
            <div className="md:col-span-6 lg:col-span-4 rounded-2xl bg-white p-5 sm:p-6 border border-neutral-200/70 shadow-xs hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
                    <Flame className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#080512]">Daily Energy</h4>
                    <span className="text-[11px] text-neutral-600">Target 2,600 kcal</span>
                  </div>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                  82% Met
                </span>
              </div>

              {/* Progress Ring Visual Representation */}
              <div className="flex items-center justify-center py-2">
                <div className="relative w-36 h-36 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="transparent"
                      stroke="#F3F4F6"
                      strokeWidth="10"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="transparent"
                      stroke="url(#calorieGradient)"
                      strokeWidth="10"
                      strokeDasharray="251.2"
                      strokeDashoffset="45"
                      strokeLinecap="round"
                    />
                    <defs>
                      <linearGradient id="calorieGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#F97316" />
                        <stop offset="100%" stopColor="#A855F7" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center text-center">
                    <span className="text-2xl font-extrabold text-[#080512] tracking-tight">2,140</span>
                    <span className="text-[10px] uppercase font-bold text-neutral-600">kcal burned</span>
                  </div>
                </div>
              </div>

              {/* Macros Breakdown */}
              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-neutral-100 text-center">
                <div className="p-2 rounded-xl bg-purple-50/70">
                  <div className="text-[10px] font-semibold text-purple-700">PROTEIN</div>
                  <div className="text-xs font-bold text-[#080512]">165g / 180g</div>
                </div>
                <div className="p-2 rounded-xl bg-amber-50/70">
                  <div className="text-[10px] font-semibold text-amber-700">CARBS</div>
                  <div className="text-xs font-bold text-[#080512]">210g / 240g</div>
                </div>
                <div className="p-2 rounded-xl bg-cyan-50/70">
                  <div className="text-[10px] font-semibold text-cyan-700">FATS</div>
                  <div className="text-xs font-bold text-[#080512]">58g / 65g</div>
                </div>
              </div>
            </div>

            {/* 2. Workout Progress & Active Session (4 Cols) */}
            <div className="md:col-span-6 lg:col-span-4 rounded-2xl bg-white p-5 sm:p-6 border border-neutral-200/70 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center text-purple-700">
                      <Dumbbell className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#080512]">Workout Progress</h4>
                      <span className="text-[11px] text-neutral-600">Hypertrophy Cycle Phase 2</span>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-ping" />
                    In Progress
                  </span>
                </div>

                <div className="bg-neutral-50 rounded-xl p-3.5 mb-3 border border-neutral-100">
                  <div className="flex justify-between text-xs font-semibold text-neutral-800 mb-1.5">
                    <span>Day 4: Posterior Chain & Hamstrings</span>
                    <span className="text-purple-700 font-bold">4 of 5 Done</span>
                  </div>
                  <div className="w-full bg-neutral-200 rounded-full h-2 overflow-hidden">
                    <div className="bg-gradient-to-r from-purple-600 to-indigo-600 h-2 rounded-full w-4/5" />
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50/60 border border-emerald-100">
                    <span className="flex items-center gap-2 text-neutral-800 font-medium">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                      Barbell RDL (4 sets x 10 @ 120kg)
                    </span>
                    <span className="font-semibold text-emerald-800">Done</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50/60 border border-emerald-100">
                    <span className="flex items-center gap-2 text-neutral-800 font-medium">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                      Seated Leg Curl (3 sets x 12 @ 75kg)
                    </span>
                    <span className="font-semibold text-emerald-800">Done</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-purple-50/80 border border-purple-100">
                    <span className="flex items-center gap-2 text-purple-900 font-bold">
                      <Clock className="w-3.5 h-3.5 text-purple-600 animate-spin" />
                      Standing Calf Raise (4 sets x 15)
                    </span>
                    <span className="font-bold text-purple-700">Set 3 Next</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 mt-3 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-600">
                <span>Rest Timer: <strong className="text-[#080512]">01:15</strong></span>
                <button className="text-purple-700 font-bold hover:underline">Complete Workout →</button>
              </div>
            </div>

            {/* 3. Steps & Weight Tracking (4 Cols) */}
            <div className="md:col-span-12 lg:col-span-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-5">
              
              {/* Steps Card */}
              <div className="rounded-2xl bg-white p-5 border border-neutral-200/70 shadow-xs hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
                      <Footprints className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#080512]">Daily Steps</h4>
                      <span className="text-[11px] text-neutral-600">Pedometer Sensor</span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-emerald-700">94%</span>
                </div>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-2xl font-extrabold text-[#080512]">9,420</span>
                  <span className="text-xs text-neutral-600 font-medium">/ 10,000 steps</span>
                </div>
                <div className="w-full bg-neutral-100 rounded-full h-2 overflow-hidden">
                  <div className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2 rounded-full w-[94%]" />
                </div>
              </div>

              {/* Weight Progression Card */}
              <div className="rounded-2xl bg-white p-5 border border-neutral-200/70 shadow-xs hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-cyan-100 flex items-center justify-center text-cyan-700">
                      <Scale className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#080512]">Weight Trajectory</h4>
                      <span className="text-[11px] text-neutral-600">Smart Scale Sync</span>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700">
                    -4.2 kg (8 Wks)
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-extrabold text-[#080512]">70.2 kg</span>
                  <span className="text-xs text-neutral-600">Goal: 68.5 kg</span>
                </div>
                {/* SVG Curve Sparkline */}
                <div className="h-10 w-full mt-2">
                  <svg className="w-full h-full" viewBox="0 0 200 40">
                    <path
                      d="M 0 10 Q 50 15, 100 24 T 200 32"
                      fill="none"
                      stroke="#06B6D4"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                    <circle cx="200" cy="32" r="4" fill="#0891B2" stroke="#FFFFFF" strokeWidth="2" />
                  </svg>
                </div>
              </div>

            </div>

            {/* 4. Weekly Activity Load Chart (Full Width on Desktop) */}
            <div className="md:col-span-12 rounded-2xl bg-white p-5 sm:p-6 border border-neutral-200/70 shadow-xs">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
                <div>
                  <h4 className="text-base font-bold text-[#080512] flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-purple-600" />
                    Weekly Volume & Caloric Output
                  </h4>
                  <p className="text-xs text-neutral-600">
                    Comparing actual workload vs weekly periodization target (4,800 kcal total target)
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1.5 text-neutral-600">
                    <span className="w-2.5 h-2.5 rounded-sm bg-purple-600" /> Completed Load
                  </span>
                  <span className="flex items-center gap-1.5 text-neutral-600">
                    <span className="w-2.5 h-2.5 rounded-sm bg-purple-200" /> Projected
                  </span>
                </div>
              </div>

              {/* Bar Graph Visualizer */}
              <div className="grid grid-cols-7 gap-2 sm:gap-4 h-40 sm:h-44 items-end pt-4 pb-2 border-b border-neutral-100">
                {weeklyData.map((item) => {
                  const isSelected = selectedDay === item.day;
                  return (
                    <button
                      key={item.day}
                      onClick={() => setSelectedDay(item.day as any)}
                      className="group flex flex-col items-center h-full justify-end cursor-pointer focus:outline-none"
                    >
                      <div className="text-[10px] font-bold text-neutral-600 group-hover:text-purple-600 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {item.calories}kcal
                      </div>
                      <div
                        className={`w-full max-w-[36px] sm:max-w-[48px] rounded-t-xl transition-all duration-300 ${
                          isSelected
                            ? 'bg-gradient-to-t from-[#080512] to-purple-600 shadow-md'
                            : item.completed
                            ? 'bg-gradient-to-t from-purple-600/80 to-purple-400 hover:brightness-105'
                            : 'bg-neutral-200 hover:bg-neutral-300'
                        }`}
                        style={{ height: `${item.intensity}%` }}
                      />
                      <span className={`text-xs font-bold mt-2 ${isSelected ? 'text-purple-700' : 'text-neutral-600'}`}>
                        {item.day}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Selected Day Details Preview */}
              <div className="flex flex-wrap items-center justify-between pt-4 text-xs text-neutral-600">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#080512]">Selected: {selectedDay}</span>
                  <span>• Active session duration: 68 mins</span>
                  <span>• Average heart rate: 142 bpm</span>
                </div>
                <div className="text-emerald-700 font-semibold flex items-center gap-1">
                  <Trophy className="w-3.5 h-3.5" />
                  Personal Record: Bench Press +5kg achieved
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
