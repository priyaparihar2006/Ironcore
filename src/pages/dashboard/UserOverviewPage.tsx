import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Dumbbell, TrendingUp, Clock, AlertCircle } from 'lucide-react';
import { PageHeader } from '../../components/dashboard/PageHeader';
import { KpiCard } from '../../components/dashboard/KpiCard';
import { Card } from '../../components/dashboard/Card';
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
        <div className="h-9 bg-neutral-200 rounded-xl w-64"></div>
        <div className="kpi-grid">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-neutral-200 rounded-2xl"></div>
          ))}
        </div>
        <div className="dashboard-grid">
          <div className="h-72 bg-neutral-200 rounded-2xl span-8"></div>
          <div className="h-72 bg-neutral-200 rounded-2xl span-4"></div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="card bg-red-50 border-red-200 text-red-700 flex flex-col items-center text-center">
        <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
        <h2 className="text-lg font-semibold">Failed to load performance metrics</h2>
        <p className="text-sm text-red-600 mb-4">{error || 'Please check your connection and try again.'}</p>
        <button onClick={fetchSummary} className="btn bg-red-600 text-white hover:bg-red-700">
          Retry
        </button>
      </div>
    );
  }

  const { stats, todayWorkout, nutrition, upcomingBooking } = data;

  const weightSupport =
    stats.weightChange30d !== null && stats.weightChange30d !== 0
      ? `${stats.weightChange30d < 0 ? '↓' : '↑'} ${Math.abs(stats.weightChange30d)} kg in 30 days`
      : stats.currentWeight !== null && stats.targetWeight !== null
        ? `${Math.abs(stats.currentWeight - stats.targetWeight).toFixed(1)} kg to goal`
        : 'Set your goal in profile';
  const weightTone =
    stats.weightChange30d === null || stats.weightChange30d === 0 ? 'neutral' : stats.weightChange30d < 0 ? 'positive' : 'negative';

  return (
    <div className="space-y-section">
      <PageHeader
        title="Overview"
        subtitle={
          stats.workoutStreak > 0
            ? `You're on a ${stats.workoutStreak}-day streak. Keep training and keep your nutrition on target.`
            : "Welcome back. Complete today's workout to start a new streak."
        }
        actions={
          <>
            <Link to="/dashboard/progress" className="btn btn-secondary">
              <TrendingUp className="w-4 h-4" />
              <span>Log Progress</span>
            </Link>
            <Link to="/dashboard/workouts" className="btn btn-primary">
              <Dumbbell className="w-4 h-4" />
              <span>Today's Workout</span>
            </Link>
          </>
        }
      />

      <div className="kpi-grid">
        <KpiCard label="Current Weight" value={stats.currentWeight ?? '—'} unit="kg" support={weightSupport} tone={weightTone} />
        <KpiCard
          label="Calories"
          value={stats.caloriesBurned.toLocaleString()}
          unit="kcal"
          support={stats.hasProgressToday ? 'Burned today' : 'No entry logged today'}
        />
        <KpiCard
          label="Daily Steps"
          value={stats.dailySteps.toLocaleString()}
          support={stats.dailySteps > 0 ? `${Math.round((stats.dailySteps / 10000) * 100)}% of 10k goal` : 'No entry logged today'}
          tone={stats.dailySteps > 0 ? 'positive' : 'neutral'}
        />
        <KpiCard
          label="Workout Streak"
          value={stats.workoutStreak}
          unit="days"
          support={stats.workoutStreak > 0 ? 'Keep the momentum going' : 'Complete a workout to start'}
        />
      </div>

      <div className="dashboard-grid">
        <Card className="span-8" title="Today's Workout" subtitle="Your assigned routine" link={{ to: '/dashboard/workouts', label: 'View all workouts' }}>
          {todayWorkout ? (
            <div className="space-y-4">
              <div className="rounded-xl bg-[var(--color-brand-bg)] border border-[var(--color-border-main)] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-base font-semibold text-[var(--color-text-main)]">{todayWorkout.workoutTitle}</h3>
                    <p className="text-xs text-[var(--color-text-muted)] mt-1">
                      Assigned by {todayWorkout.assignedByTrainerName || 'Head Coach'}
                    </p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase shrink-0 ${
                    todayWorkout.status === 'COMPLETED'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {todayWorkout.status}
                  </span>
                </div>

                {todayWorkout.notes && (
                  <div className="mt-3 p-3 rounded-lg bg-[var(--color-card-bg)] border border-[var(--color-border-main)] text-xs text-neutral-600 italic">
                    "{todayWorkout.notes}"
                  </div>
                )}

                <div className="mt-4">
                  <div className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-1">
                    Exercises ({todayWorkout.exercises.length})
                  </div>
                  <div className="divide-y divide-[var(--color-border-main)] max-h-48 overflow-y-auto pr-2">
                    {todayWorkout.exercises.slice(0, 4).map((ex, idx) => (
                      <div key={ex.id || idx} className="py-2 flex items-center justify-between gap-3 text-sm">
                        <div className="min-w-0">
                          <span className="font-medium text-[var(--color-text-main)]">{ex.name}</span>
                          <span className="text-xs text-[var(--color-text-muted)] ml-2">({ex.targetMuscle})</span>
                        </div>
                        <div className="font-mono text-neutral-600 text-xs shrink-0">
                          {ex.sets} × {ex.reps} {ex.weightKg ? `@ ${ex.weightKg}kg` : ''}
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
                  className="btn btn-primary w-full"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{completing ? 'Logging completion...' : 'Mark Workout Complete'}</span>
                </button>
              ) : (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm font-medium flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Completed today. Great work.
                </div>
              )}
            </div>
          ) : (
            <div className="py-10 text-center text-[var(--color-text-muted)]">
              <Dumbbell className="w-8 h-8 mx-auto text-neutral-300 mb-2" />
              <p className="text-sm">No workout assigned for today.</p>
              <Link to="/dashboard/workouts" className="card-link mt-2 inline-block">
                Choose from workout library
              </Link>
            </div>
          )}
        </Card>

        <div className="span-4 space-y-6 min-w-0">
          <Card title="Daily Nutrition" link={{ to: '/dashboard/nutrition', label: 'Log meal' }}>
            {nutrition ? (
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between gap-2 text-xs mb-1.5">
                    <span className="text-[var(--color-text-muted)]">Calories</span>
                    <span className="font-medium text-[var(--color-text-main)]">
                      {nutrition.consumedCalories} kcal {nutrition.dailyCalorieTarget ? `/ ${nutrition.dailyCalorieTarget}` : '(no target set)'}
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

                <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                  {[
                    ['Protein', nutrition.consumedProteinGrams, nutrition.proteinTargetGrams],
                    ['Carbs', nutrition.consumedCarbsGrams, nutrition.carbsTargetGrams],
                    ['Fats', nutrition.consumedFatsGrams, nutrition.fatsTargetGrams],
                  ].map(([label, consumed, target]) => (
                    <div key={label} className="p-2 rounded-lg bg-[var(--color-brand-bg)] border border-[var(--color-border-main)]">
                      <div className="text-xs text-[var(--color-text-muted)]">{label}</div>
                      <div className="text-sm font-semibold text-[var(--color-text-main)] mt-0.5">
                        {consumed}g <span className="text-xs font-normal text-[var(--color-text-muted)]">/ {target}g</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-2">
                <p className="card-subtitle mb-3">No meals logged today yet.</p>
                <Link to="/dashboard/nutrition" className="btn btn-secondary">Log Your First Meal</Link>
              </div>
            )}
          </Card>

          <Card title="Next Coaching Session" link={{ to: '/dashboard/bookings', label: 'Schedule' }}>
            {upcomingBooking ? (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-[var(--color-text-main)]">{upcomingBooking.sessionType}</span>
                  <span className="text-xs font-semibold uppercase px-2 py-1 rounded-full bg-emerald-100 text-emerald-800">
                    Confirmed
                  </span>
                </div>
                <div className="text-sm text-[var(--color-text-muted)]">Coach {upcomingBooking.trainerName}</div>
                <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)] pt-1">
                  <Clock className="w-4 h-4" />
                  <span>{upcomingBooking.date} • {upcomingBooking.timeSlot}</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-2">
                <p className="card-subtitle mb-3">No upcoming coaching sessions booked.</p>
                <Link to="/dashboard/bookings" className="btn btn-secondary">Book 1-on-1 Session</Link>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};
