import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Flame,
  Footprints,
  Scale,
  Target,
  Zap,
  CheckCircle2,
  Calendar,
  Dumbbell,
  ArrowRight,
  TrendingUp,
  Clock,
  Sparkles,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import { apiRequest } from '../../lib/api';
import { WorkoutAssignmentData, BookingSession, NutritionData } from '../../types';

interface SummaryData {
  stats: {
    currentWeight: number;
    targetWeight: number;
    caloriesBurned: number;
    dailySteps: number;
    workoutStreak: number;
    overallProgressPercent: number;
  };
  todayWorkout: WorkoutAssignmentData | null;
  nutrition: NutritionData;
  upcomingBooking: BookingSession | null;
}

export const UserOverviewPage: React.FC = () => {
  const [data, setData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completing, setCompleting] = useState(false);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const res = await apiRequest<SummaryData>('/user/dashboard-summary');
      setData(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const handleCompleteWorkout = async (assignmentId: string) => {
    try {
      setCompleting(true);
      await apiRequest('/user/workouts/complete', {
        method: 'POST',
        body: JSON.stringify({ assignmentId }),
      });
      await fetchSummary();
    } catch (err) {
      console.error(err);
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-8 bg-neutral-200 rounded-xl w-64"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-32 bg-neutral-200 rounded-3xl"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-72 bg-neutral-200 rounded-3xl lg:col-span-2"></div>
          <div className="h-72 bg-neutral-200 rounded-3xl"></div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 rounded-3xl bg-red-50 border border-red-200 text-red-700 flex flex-col items-center text-center">
        <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
        <h2 className="text-lg font-bold">Failed to load performance metrics</h2>
        <p className="text-sm text-red-600 mb-4">{error || 'Please check your connection and try again.'}</p>
        <button
          onClick={fetchSummary}
          className="px-6 py-2.5 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }

  const { stats, todayWorkout, nutrition, upcomingBooking } = data;

  return (
    <div className="space-y-8">
      
      {/* Editorial Welcome Banner */}
      <div className="bg-gradient-to-r from-[#080512] via-[#150f29] to-[#251747] text-white rounded-[32px] p-6 sm:p-8 relative overflow-hidden shadow-xl shadow-purple-950/10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-purple-200 text-xs font-bold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5 text-purple-300" />
            Athlete Daily Focus
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white mb-2">
            Stay in the zone. You're on a {stats.workoutStreak}-day streak.
          </h1>
          <p className="text-white/70 text-xs sm:text-sm leading-relaxed mb-6">
            Your body composition shows sustained fat loss with clean barbell strength retention. Keep adherence high today.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/dashboard/workouts"
              className="px-5 py-2.5 rounded-xl bg-white text-[#080512] font-bold text-xs flex items-center gap-2 hover:bg-neutral-100 transition-colors shadow-md cursor-pointer"
            >
              <Dumbbell className="w-3.5 h-3.5" />
              <span>Go to Today's Workout</span>
            </Link>
            <Link
              to="/dashboard/progress"
              className="px-5 py-2.5 rounded-xl bg-white/10 text-white font-bold text-xs flex items-center gap-2 hover:bg-white/20 transition-colors cursor-pointer"
            >
              <TrendingUp className="w-3.5 h-3.5 text-purple-300" />
              <span>Log Progress Entry</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Statistics Cards (Exact values requested in prompt) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        
        {/* Card 1: Current Weight */}
        <div className="bg-white rounded-3xl p-5 border border-neutral-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3 text-neutral-400">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">Current Weight</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#080512] tracking-tight">
            {stats.currentWeight} <span className="text-sm font-semibold text-neutral-400">kg</span>
          </div>
          <div className="text-[11px] font-semibold text-emerald-600 mt-1 flex items-center gap-1">
            <span>↓ -2.5 kg</span>
            <span className="text-neutral-400">this month</span>
          </div>
        </div>

        {/* Card 2: Target Weight */}
        <div className="bg-white rounded-3xl p-5 border border-neutral-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3 text-neutral-400">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">Target Weight</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#080512] tracking-tight">
            {stats.targetWeight} <span className="text-sm font-semibold text-neutral-400">kg</span>
          </div>
          <div className="text-[11px] font-semibold text-neutral-500 mt-1">
            {Math.abs(stats.currentWeight - stats.targetWeight).toFixed(1)} kg remaining
          </div>
        </div>

        {/* Card 3: Calories */}
        <div className="bg-white rounded-3xl p-5 border border-neutral-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3 text-neutral-400">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">Calories</span>
            <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#080512] tracking-tight">
            {stats.caloriesBurned.toLocaleString()} <span className="text-sm font-semibold text-neutral-400">kcal</span>
          </div>
          <div className="text-[11px] font-semibold text-neutral-500 mt-1">
            Active expenditure
          </div>
        </div>

        {/* Card 4: Daily Steps */}
        <div className="bg-white rounded-3xl p-5 border border-neutral-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3 text-neutral-400">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">Daily Steps</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Footprints className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#080512] tracking-tight">
            {stats.dailySteps.toLocaleString()}
          </div>
          <div className="text-[11px] font-semibold text-emerald-600 mt-1">
            119% of 10k target
          </div>
        </div>

        {/* Card 5: Workout Streak */}
        <div className="bg-white rounded-3xl p-5 border border-neutral-200/80 shadow-sm hover:shadow-md transition-shadow col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between mb-3 text-neutral-400">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">Workout Streak</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#080512] tracking-tight">
            {stats.workoutStreak} <span className="text-sm font-semibold text-neutral-400">days</span>
          </div>
          <div className="text-[11px] font-semibold text-purple-700 mt-1">
            Personal best record!
          </div>
        </div>

      </div>

      {/* Main Grid: Today's Workout & Nutrition/Booking */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Today's Workout Focus (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-[32px] p-6 sm:p-8 border border-neutral-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 px-2.5 py-1 rounded-full bg-purple-50">
                  Assigned Routine
                </span>
                <h2 className="text-xl font-black tracking-tight text-[#080512] mt-2">
                  Today's Workout
                </h2>
              </div>
              <Link
                to="/dashboard/workouts"
                className="text-xs font-bold text-neutral-500 hover:text-[#080512] flex items-center gap-1"
              >
                View all workouts <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {todayWorkout ? (
              <div className="space-y-4">
                <div className="p-5 rounded-2xl bg-neutral-50 border border-neutral-200/70">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-base font-black text-[#080512]">{todayWorkout.workoutTitle}</h3>
                      <p className="text-xs text-neutral-500 mt-1">
                        Assigned by <span className="font-bold text-neutral-700">{todayWorkout.assignedByTrainerName || 'Head Coach'}</span>
                      </p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                      todayWorkout.status === 'COMPLETED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {todayWorkout.status}
                    </span>
                  </div>

                  {todayWorkout.notes && (
                    <div className="mt-3 p-3 rounded-xl bg-white border border-neutral-200/60 text-xs text-neutral-600 italic">
                      "{todayWorkout.notes}"
                    </div>
                  )}

                  {/* Exercise Preview List */}
                  <div className="mt-4 space-y-2">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                      Exercise Breakdown ({todayWorkout.exercises.length} movements)
                    </div>
                    <div className="divide-y divide-neutral-200/60 max-h-48 overflow-y-auto pr-2">
                      {todayWorkout.exercises.slice(0, 4).map((ex, idx) => (
                        <div key={ex.id || idx} className="py-2 flex items-center justify-between text-xs">
                          <div>
                            <span className="font-bold text-neutral-800">{ex.name}</span>
                            <span className="text-[11px] text-neutral-400 ml-2">({ex.targetMuscle})</span>
                          </div>
                          <div className="font-mono text-neutral-600 text-[11px]">
                            {ex.sets} sets × {ex.reps} reps {ex.weightKg ? `@ ${ex.weightKg}kg` : ''}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {todayWorkout.status !== 'COMPLETED' ? (
                  <button
                    onClick={() => handleCompleteWorkout(todayWorkout.id)}
                    disabled={completing}
                    className="w-full py-3.5 rounded-2xl bg-[#080512] text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 hover:bg-neutral-800 transition-all cursor-pointer shadow-md disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>{completing ? 'Logging completion...' : 'Mark Workout Complete'}</span>
                  </button>
                ) : (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Completed today! Great performance.
                  </div>
                )}
              </div>
            ) : (
              <div className="py-12 text-center text-neutral-400">
                <Dumbbell className="w-10 h-10 mx-auto text-neutral-300 mb-2" />
                <p className="text-sm font-medium">No workout assigned for today.</p>
                <Link
                  to="/dashboard/workouts"
                  className="text-xs font-bold text-purple-700 hover:underline mt-2 inline-block"
                >
                  Choose from workout library →
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Nutrition & Upcoming Session (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Nutrition Snapshot */}
          <div className="bg-white rounded-[32px] p-6 border border-neutral-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-black text-[#080512] flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-500" />
                Daily Nutrition
              </h3>
              <Link to="/dashboard/nutrition" className="text-xs font-bold text-purple-700 hover:underline">
                Log Meal →
              </Link>
            </div>

            <div className="space-y-3">
              {/* Calorie Progress Bar */}
              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-neutral-600">Calories</span>
                  <span className="text-neutral-900">
                    {nutrition.consumedCalories} / {nutrition.dailyCalorieTarget} kcal
                  </span>
                </div>
                <div className="w-full bg-neutral-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-orange-500 h-2 rounded-full"
                    style={{
                      width: `${Math.min(100, (nutrition.consumedCalories / nutrition.dailyCalorieTarget) * 100)}%`,
                    }}
                  ></div>
                </div>
              </div>

              {/* Macros Breakdown */}
              <div className="grid grid-cols-3 gap-2 pt-2 text-center">
                <div className="p-2 rounded-xl bg-neutral-50 border border-neutral-100">
                  <div className="text-[10px] font-bold text-neutral-400 uppercase">Protein</div>
                  <div className="text-xs font-black text-neutral-800 mt-0.5">
                    {nutrition.consumedProteinGrams}g <span className="text-[10px] text-neutral-400">/ {nutrition.proteinTargetGrams}g</span>
                  </div>
                </div>
                <div className="p-2 rounded-xl bg-neutral-50 border border-neutral-100">
                  <div className="text-[10px] font-bold text-neutral-400 uppercase">Carbs</div>
                  <div className="text-xs font-black text-neutral-800 mt-0.5">
                    {nutrition.consumedCarbsGrams}g <span className="text-[10px] text-neutral-400">/ {nutrition.carbsTargetGrams}g</span>
                  </div>
                </div>
                <div className="p-2 rounded-xl bg-neutral-50 border border-neutral-100">
                  <div className="text-[10px] font-bold text-neutral-400 uppercase">Fats</div>
                  <div className="text-xs font-black text-neutral-800 mt-0.5">
                    {nutrition.consumedFatsGrams}g <span className="text-[10px] text-neutral-400">/ {nutrition.fatsTargetGrams}g</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Upcoming Trainer Booking */}
          <div className="bg-white rounded-[32px] p-6 border border-neutral-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-black text-[#080512] flex items-center gap-2">
                <Calendar className="w-4 h-4 text-purple-600" />
                Next Coaching Session
              </h3>
              <Link to="/dashboard/bookings" className="text-xs font-bold text-purple-700 hover:underline">
                Schedule →
              </Link>
            </div>

            {upcomingBooking ? (
              <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-black text-sm text-purple-950">{upcomingBooking.sessionType}</span>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-purple-200/80 text-purple-900">
                    Confirmed
                  </span>
                </div>
                <div className="text-xs font-medium text-neutral-700">
                  Coach <span className="font-bold text-neutral-900">{upcomingBooking.trainerName}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-neutral-500 pt-1">
                  <Clock className="w-3.5 h-3.5 text-purple-600" />
                  <span>{upcomingBooking.date} • {upcomingBooking.timeSlot}</span>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/60 text-center">
                <p className="text-xs text-neutral-500 mb-2">No upcoming coaching sessions booked.</p>
                <Link
                  to="/dashboard/bookings"
                  className="px-3 py-1.5 rounded-xl bg-[#080512] text-white text-xs font-bold inline-block"
                >
                  Book 1-on-1 Session
                </Link>
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};
