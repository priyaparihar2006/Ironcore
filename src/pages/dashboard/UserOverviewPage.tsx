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

interface DashboardProfile {
  userId: string;
  currentWeight: number;
  targetWeight: number;
  height: number;
  bodyFatPercentage: number;
  muscleMass: number;
  emergencyContact?: string;
  bio?: string;
}

interface SummaryData {
  stats: {
    currentWeight: number | null;
    targetWeight: number | null;
    caloriesBurned: number;
    dailySteps: number;
    hasProgressToday: boolean;
    workoutStreak: number;
    weightChange30d: number | null;
    overallProgressPercent: number | null;
  };
  profile: DashboardProfile | null;
  todayWorkout: WorkoutAssignmentData | null;
  nutrition: NutritionData | null;
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
      <div className="space-y-section animate-pulse">
        <div className="h-8 bg-neutral-200 rounded-xl w-64"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5 gap-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-32 bg-neutral-200 rounded-3xl"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="h-72 bg-neutral-200 rounded-3xl lg:col-span-2"></div>
          <div className="h-72 bg-neutral-200 rounded-3xl"></div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-card rounded-3xl bg-red-50 border border-red-200 text-red-700 flex flex-col items-center text-center">
        <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
        <h2 className="text-lg font-bold">Failed to load performance metrics</h2>
        <p className="text-sm text-red-600 mb-4">{error || 'Please check your connection and try again.'}</p>
        <button
          onClick={fetchSummary}
          className="px-6 py-3 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }

  const { stats, todayWorkout, nutrition, upcomingBooking } = data;

  return (
    <div className="space-y-section">
      
      {/* Editorial Welcome Banner */}
      <div className="bg-gradient-to-r from-[#080512] via-[#150f29] to-[#251747] text-white rounded-lg p-card sm:p-card relative overflow-hidden shadow-sm">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--color-brand-bg)]0/15 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-purple-200 text-xs font-bold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5 text-purple-300" />
            Athlete Daily Focus
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
            {stats.workoutStreak > 0
              ? `Stay in the zone. You're on a ${stats.workoutStreak}-day streak.`
              : `Welcome back. Let's start a new streak today.`}
          </h1>
          <p className="text-white/70 text-xs sm:text-sm leading-relaxed mb-6">
            Stay consistent with today's assigned training and keep your nutrition on target.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/dashboard/workouts"
              className="px-6 py-3 rounded-xl bg-white text-[var(--color-text-main)] font-bold text-xs flex items-center gap-2 hover:bg-neutral-100 transition-colors shadow-sm cursor-pointer"
            >
              <Dumbbell className="w-3.5 h-3.5" />
              <span>Go to Today's Workout</span>
            </Link>
            <Link
              to="/dashboard/progress"
              className="px-6 py-3 rounded-xl bg-white/10 text-white font-bold text-xs flex items-center gap-2 hover:bg-white/20 transition-colors cursor-pointer"
            >
              <TrendingUp className="w-3.5 h-3.5 text-purple-300" />
              <span>Log Progress Entry</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Statistics Cards (Exact values requested in prompt) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 2xl:grid-cols-5 gap-6">
        
        {/* Card 1: Current Weight */}
        <div className="bg-white rounded-3xl p-card border border-[var(--color-border-main)]/80 shadow-sm hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between mb-3 text-[var(--color-text-muted)]">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Current Weight</span>
            <div className="w-8 h-8 rounded-xl bg-[var(--color-brand-bg)] text-purple-600 flex items-center justify-center">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-[var(--color-text-main)] tracking-tight">
            {stats.currentWeight ?? '—'} <span className="text-sm font-semibold text-[var(--color-text-muted)]">kg</span>
          </div>
          {stats.weightChange30d !== null && stats.weightChange30d !== 0 ? (
            <div
              className={`text-xs font-semibold mt-1 flex items-center gap-1 ${
                stats.weightChange30d < 0 ? 'text-emerald-600' : 'text-orange-600'
              }`}
            >
              <span>
                {stats.weightChange30d < 0 ? '↓' : '↑'} {stats.weightChange30d > 0 ? '+' : ''}
                {stats.weightChange30d} kg
              </span>
              <span className="text-[var(--color-text-muted)]">last 30 days</span>
            </div>
          ) : (
            <div className="text-xs font-semibold text-[var(--color-text-muted)] mt-1">Not enough data yet</div>
          )}
        </div>

        {/* Card 2: Target Weight */}
        <div className="bg-white rounded-3xl p-card border border-[var(--color-border-main)]/80 shadow-sm hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between mb-3 text-[var(--color-text-muted)]">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Target Weight</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-[var(--color-text-main)] tracking-tight">
            {stats.targetWeight ?? '—'} <span className="text-sm font-semibold text-[var(--color-text-muted)]">kg</span>
          </div>
          <div className="text-xs font-semibold text-[var(--color-text-muted)] mt-1">
            {stats.currentWeight !== null && stats.targetWeight !== null
              ? `${Math.abs(stats.currentWeight - stats.targetWeight).toFixed(1)} kg to goal`
              : 'Set your goal in profile'}
          </div>
        </div>

        {/* Card 3: Calories */}
        <div className="bg-white rounded-3xl p-card border border-[var(--color-border-main)]/80 shadow-sm hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between mb-3 text-[var(--color-text-muted)]">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Calories</span>
            <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-[var(--color-text-main)] tracking-tight">
            {stats.caloriesBurned.toLocaleString()} <span className="text-sm font-semibold text-[var(--color-text-muted)]">kcal</span>
          </div>
          <div className="text-xs font-semibold text-[var(--color-text-muted)] mt-1">
            {stats.hasProgressToday ? 'Active expenditure today' : 'No entry logged today'}
          </div>
        </div>

        {/* Card 4: Daily Steps */}
        <div className="bg-white rounded-3xl p-card border border-[var(--color-border-main)]/80 shadow-sm hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between mb-3 text-[var(--color-text-muted)]">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Daily Steps</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Footprints className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-[var(--color-text-main)] tracking-tight">
            {stats.dailySteps.toLocaleString()}
          </div>
          <div
            className={`text-xs font-semibold mt-1 ${
              stats.dailySteps > 0 ? 'text-emerald-600' : 'text-[var(--color-text-muted)]'
            }`}
          >
            {stats.dailySteps > 0
              ? `${Math.round((stats.dailySteps / 10000) * 100)}% of 10k goal`
              : 'No entry logged today'}
          </div>
        </div>

        {/* Card 5: Workout Streak */}
        <div className="bg-white rounded-3xl p-card border border-[var(--color-border-main)]/80 shadow-sm hover:shadow-sm transition-shadow col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between mb-3 text-[var(--color-text-muted)]">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Workout Streak</span>
            <div className="w-8 h-8 rounded-xl bg-[var(--color-brand-bg)] text-purple-600 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-[var(--color-text-main)] tracking-tight">
            {stats.workoutStreak} <span className="text-sm font-semibold text-[var(--color-text-muted)]">days</span>
          </div>
          <div className="text-xs font-semibold text-[var(--color-text-main)] mt-1">
            {stats.workoutStreak > 0 ? 'Keep the momentum going' : 'Complete a workout to start'}
          </div>
        </div>

      </div>

      {/* Main Grid: Today's Workout & Nutrition/Booking */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Today's Workout Focus (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-lg p-card sm:p-card border border-[var(--color-border-main)]/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-main)] px-3 py-1 rounded-full bg-[var(--color-brand-bg)]">
                  Assigned Routine
                </span>
                <h2 className="text-xl font-bold tracking-tight text-[var(--color-text-main)] mt-2">
                  Today's Workout
                </h2>
              </div>
              <Link
                to="/dashboard/workouts"
                className="text-xs font-bold text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] flex items-center gap-1"
              >
                View all workouts <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {todayWorkout ? (
              <div className="space-y-4">
                <div className="p-card rounded-lg bg-[var(--color-brand-bg)] border border-[var(--color-border-main)]/70">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-base font-bold text-[var(--color-text-main)]">{todayWorkout.workoutTitle}</h3>
                      <p className="text-xs text-[var(--color-text-muted)] mt-1">
                        Assigned by <span className="font-bold text-neutral-700">{todayWorkout.assignedByTrainerName || 'Head Coach'}</span>
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                      todayWorkout.status === 'COMPLETED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {todayWorkout.status}
                    </span>
                  </div>

                  {todayWorkout.notes && (
                    <div className="mt-3 p-3 rounded-xl bg-white border border-[var(--color-border-main)]/60 text-xs text-neutral-600 italic">
                      "{todayWorkout.notes}"
                    </div>
                  )}

                  {/* Exercise Preview List */}
                  <div className="mt-4 space-y-2">
                    <div className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                      Exercise Breakdown ({todayWorkout.exercises.length} movements)
                    </div>
                    <div className="divide-y divide-neutral-200/60 max-h-48 overflow-y-auto pr-2">
                      {todayWorkout.exercises.slice(0, 4).map((ex, idx) => (
                        <div key={ex.id || idx} className="py-2 flex items-center justify-between text-xs">
                          <div>
                            <span className="font-bold text-[var(--color-text-main)]">{ex.name}</span>
                            <span className="text-xs text-[var(--color-text-muted)] ml-2">({ex.targetMuscle})</span>
                          </div>
                          <div className="font-mono text-neutral-600 text-xs">
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
                    className="w-full py-4 rounded-lg bg-[var(--color-primary)] text-[var(--color-text-main)] text-xs sm:text-sm font-bold flex items-center justify-center gap-2 hover:bg-neutral-800 transition-all cursor-pointer shadow-sm disabled:opacity-50"
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
              <div className="py-12 text-center text-[var(--color-text-muted)]">
                <Dumbbell className="w-10 h-10 mx-auto text-neutral-300 mb-2" />
                <p className="text-sm font-medium">No workout assigned for today.</p>
                <Link
                  to="/dashboard/workouts"
                  className="text-xs font-bold text-[var(--color-text-main)] hover:underline mt-2 inline-block"
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
          <div className="bg-white rounded-lg p-card border border-[var(--color-border-main)]/80 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-[var(--color-text-main)] flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-500" />
                Daily Nutrition
              </h3>
              <Link to="/dashboard/nutrition" className="text-xs font-bold text-[var(--color-text-main)] hover:underline">
                Log Meal →
              </Link>
            </div>

            {nutrition ? (
            <div className="space-y-3">
              {/* Calorie Progress Bar */}
              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-neutral-600">Calories</span>
                  <span className="text-[var(--color-text-main)]">
                    {nutrition.consumedCalories} kcal {nutrition.dailyCalorieTarget ? `/ ${nutrition.dailyCalorieTarget} target` : '? target not set'}
                  </span>
                </div>
                <div className="w-full bg-neutral-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-orange-500 h-2 rounded-full"
                    style={{
                      width: `${Math.min(100, (nutrition.consumedCalories / (nutrition.dailyCalorieTarget || 1)) * 100)}%`,
                    }}
                  ></div>
                </div>
              </div>

              {/* Macros Breakdown */}
              <div className="grid grid-cols-3 gap-2 pt-2 text-center">
                <div className="p-2 rounded-xl bg-[var(--color-brand-bg)] border border-neutral-100">
                  <div className="text-xs font-bold text-[var(--color-text-muted)] uppercase">Protein</div>
                  <div className="text-xs font-bold text-[var(--color-text-main)] mt-1">
                    {nutrition.consumedProteinGrams}g <span className="text-xs text-[var(--color-text-muted)]">/ {nutrition.proteinTargetGrams}g</span>
                  </div>
                </div>
                <div className="p-2 rounded-xl bg-[var(--color-brand-bg)] border border-neutral-100">
                  <div className="text-xs font-bold text-[var(--color-text-muted)] uppercase">Carbs</div>
                  <div className="text-xs font-bold text-[var(--color-text-main)] mt-1">
                    {nutrition.consumedCarbsGrams}g <span className="text-xs text-[var(--color-text-muted)]">/ {nutrition.carbsTargetGrams}g</span>
                  </div>
                </div>
                <div className="p-2 rounded-xl bg-[var(--color-brand-bg)] border border-neutral-100">
                  <div className="text-xs font-bold text-[var(--color-text-muted)] uppercase">Fats</div>
                  <div className="text-xs font-bold text-[var(--color-text-main)] mt-1">
                    {nutrition.consumedFatsGrams}g <span className="text-xs text-[var(--color-text-muted)]">/ {nutrition.fatsTargetGrams}g</span>
                  </div>
                </div>
              </div>
            </div>
            ) : (
              <div className="p-card rounded-lg bg-[var(--color-brand-bg)] border border-[var(--color-border-main)]/60 text-center">
                <p className="text-xs text-[var(--color-text-muted)] mb-2">No meals logged today yet.</p>
                <Link
                  to="/dashboard/nutrition"
                  className="px-3 py-2 rounded-xl bg-[var(--color-primary)] text-[var(--color-text-main)] text-xs font-bold inline-block"
                >
                  Log Your First Meal
                </Link>
              </div>
            )}
          </div>

          {/* Upcoming Trainer Booking */}
          <div className="bg-white rounded-lg p-card border border-[var(--color-border-main)]/80 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-[var(--color-text-main)] flex items-center gap-2">
                <Calendar className="w-4 h-4 text-purple-600" />
                Next Coaching Session
              </h3>
              <Link to="/dashboard/bookings" className="text-xs font-bold text-[var(--color-text-main)] hover:underline">
                Schedule →
              </Link>
            </div>

            {upcomingBooking ? (
              <div className="p-card rounded-lg bg-[var(--color-brand-bg)]/70 border border-[var(--color-border-main)]/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-purple-950">{upcomingBooking.sessionType}</span>
                  <span className="text-xs font-bold uppercase px-2 py-1 rounded-full bg-purple-200/80 text-[var(--color-text-main)]">
                    Confirmed
                  </span>
                </div>
                <div className="text-xs font-medium text-neutral-700">
                  Coach <span className="font-bold text-[var(--color-text-main)]">{upcomingBooking.trainerName}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)] pt-1">
                  <Clock className="w-3.5 h-3.5 text-purple-600" />
                  <span>{upcomingBooking.date} • {upcomingBooking.timeSlot}</span>
                </div>
              </div>
            ) : (
              <div className="p-card rounded-lg bg-[var(--color-brand-bg)] border border-[var(--color-border-main)]/60 text-center">
                <p className="text-xs text-[var(--color-text-muted)] mb-2">No upcoming coaching sessions booked.</p>
                <Link
                  to="/dashboard/bookings"
                  className="px-3 py-2 rounded-xl bg-[var(--color-primary)] text-[var(--color-text-main)] text-xs font-bold inline-block"
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
