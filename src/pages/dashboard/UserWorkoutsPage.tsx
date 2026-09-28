import { PageHeader } from '../../components/dashboard/PageHeader';
import { Badge } from '../../components/dashboard/Badge';
import { EmptyState } from '../../components/dashboard/EmptyState';
import React, { useEffect, useState } from 'react';
import { Dumbbell, CheckCircle2, Clock, Calendar, AlertCircle, ChevronDown, ChevronUp, Flame, Play } from 'lucide-react';
import { apiRequest } from '../../lib/api';
import { ExerciseItem, WorkoutAssignmentData } from '../../types';

// Muscle groups cycle through a fixed, non-random set of accent tints for the
// exercise card's image slot (there's no real exercise photography to show).
const MUSCLE_TINTS = [
  'bg-blue-50 text-blue-500',
  'bg-orange-50 text-orange-500',
  'bg-emerald-50 text-emerald-500',
  'bg-purple-50 text-purple-500',
  'bg-rose-50 text-rose-500',
];
function tintFor(muscle: string) {
  let hash = 0;
  for (let i = 0; i < muscle.length; i++) hash = (hash * 31 + muscle.charCodeAt(i)) >>> 0;
  return MUSCLE_TINTS[hash % MUSCLE_TINTS.length];
}

/** Rough session length from real logged sets/reps/rest — ~3s per rep plus each set's rest, never a fabricated fixed number. */
function estimateMinutes(exercises: ExerciseItem[]): number {
  const seconds = exercises.reduce((total, ex) => total + ex.sets * (ex.reps * 3 + ex.restSeconds), 0);
  return Math.max(5, Math.round(seconds / 60));
}

function statusBadge(status: WorkoutAssignmentData['status']) {
  if (status === 'COMPLETED') return <Badge tone="success" dot>Completed</Badge>;
  if (status === 'IN_PROGRESS') return <Badge tone="info" dot>In Progress</Badge>;
  return <Badge tone="warning" dot>Pending</Badge>;
}

const ExerciseCard: React.FC<{ exercise: ExerciseItem }> = ({ exercise }) => {
  return (
    <div className="rounded-xl border border-[var(--color-border-main)] overflow-hidden bg-[var(--color-card-bg)]">
      <div className={`aspect-video flex items-center justify-center ${tintFor(exercise.targetMuscle)}`}>
        <Dumbbell size={28} />
      </div>
      <div className="p-4">
        <h4 className="text-sm font-bold text-[var(--color-text-main)]">{exercise.name}</h4>
        <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{exercise.targetMuscle}</p>
        <div className="flex items-center justify-between mt-3">
          <span className="text-sm font-semibold text-[var(--color-text-main)]">
            {exercise.sets} sets × {exercise.reps} reps
          </span>
          <span className="text-xs text-[var(--color-text-muted)] flex items-center gap-1">
            <Clock size={12} /> {exercise.restSeconds}s rest
          </span>
        </div>
        <p className="text-xs font-semibold text-[var(--color-text-muted)] mt-1">
          {exercise.weightKg ? `${exercise.weightKg} kg` : 'Bodyweight'}
        </p>
      </div>
    </div>
  );
};

export const UserWorkoutsPage: React.FC = () => {
  const [workouts, setWorkouts] = useState<WorkoutAssignmentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'COMPLETED'>('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchWorkouts = async () => {
    try {
      setLoading(true);
      const res = await apiRequest<{ workouts: WorkoutAssignmentData[] }>('/user/workouts');
      setWorkouts(res.workouts || []);
      if (res.workouts?.length > 0) {
        setExpandedId(res.workouts[0].id);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load workouts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkouts();
  }, []);

  const handleMarkComplete = async (assignmentId: string) => {
    try {
      setActionLoading(assignmentId);
      await apiRequest('/user/workouts/complete', {
        method: 'POST',
        body: JSON.stringify({ assignmentId }),
      });
      await fetchWorkouts();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const todayWorkout = workouts.find((w) => w.scheduledDate === todayStr && w.status !== 'COMPLETED');
  const otherWorkouts = workouts.filter((w) => w.id !== todayWorkout?.id);
  const filteredWorkouts = otherWorkouts.filter((w) => {
    if (filter === 'ALL') return true;
    return w.status === filter;
  });

  return (
    <div className="space-y-section">
      {/* Header */}
      <PageHeader
        title="My Workouts"
        subtitle="Your assigned training routines, sets and completions."
        actions={
          <>
            {/* Filter Pills */}
            <div className="flex bg-neutral-100 p-2 rounded-lg self-start">
              {(['ALL', 'PENDING', 'COMPLETED'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    filter === tab
                      ? 'bg-white text-[var(--color-text-main)] shadow-sm'
                      : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]'
                  }`}
                >
                  {tab === 'ALL' ? 'All Routines' : tab === 'PENDING' ? 'Active / Upcoming' : 'Completed'}
                </button>
              ))}
            </div>
          </>
        }
      />

      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 bg-neutral-200 rounded-3xl"></div>
          ))}
        </div>
      ) : error ? (
        <div className="card bg-red-50 border-red-200 text-red-700 flex flex-col items-center text-center">
          <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
          <h2 className="text-lg font-bold">Error loading workouts</h2>
          <p className="text-sm text-red-600 mb-4">{error}</p>
          <button onClick={fetchWorkouts} className="btn bg-red-600 text-white">
            Retry
          </button>
        </div>
      ) : workouts.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Dumbbell}
            title="No workouts yet"
            body="Your trainer hasn't assigned a routine yet — it'll appear here as soon as they do."
          />
        </div>
      ) : (
        <div className="space-y-section">
          {/* Today's Workout — energetic hero, mirrors the athlete's daily focus. */}
          {todayWorkout && (
            <div className="card bg-gradient-to-br from-[#080512] via-[#1a122e] to-[#2e1a50] text-white overflow-hidden relative">
              <div className="absolute top-0 right-0 w-72 h-72 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-purple-200 text-xs font-bold uppercase tracking-wider mb-3">
                  <Flame size={14} /> Today's Workout
                </div>
                <h2 className="text-2xl font-bold tracking-tight">{todayWorkout.workoutTitle}</h2>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/70 mt-2">
                  <span>{todayWorkout.exercises.length} Exercises</span>
                  <span>·</span>
                  <span>~{estimateMinutes(todayWorkout.exercises)} min</span>
                  <span>·</span>
                  <span>Coach {todayWorkout.assignedByTrainerName || 'IronCore Staff'}</span>
                </div>
                <button
                  onClick={() => setExpandedId(todayWorkout.id)}
                  className="btn btn-primary mt-6"
                >
                  <Play size={16} />
                  <span>{todayWorkout.status === 'IN_PROGRESS' ? 'Continue Workout' : 'Start Workout'}</span>
                </button>

                {expandedId === todayWorkout.id && (
                  <div className="mt-8 pt-6 border-t border-white/10">
                    {todayWorkout.notes && (
                      <p className="text-sm text-white/70 italic mb-4">"{todayWorkout.notes}"</p>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {todayWorkout.exercises.map((ex, idx) => (
                        <ExerciseCard key={ex.id || idx} exercise={ex} />
                      ))}
                    </div>
                    <button
                      onClick={() => handleMarkComplete(todayWorkout.id)}
                      disabled={actionLoading === todayWorkout.id}
                      className="btn btn-primary w-full mt-6"
                    >
                      <CheckCircle2 size={16} />
                      <span>{actionLoading === todayWorkout.id ? 'Saving...' : 'Mark Workout Complete'}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {filteredWorkouts.length === 0 ? (
            <div className="card">
              <EmptyState
                icon={Dumbbell}
                title="No routines in this view"
                body="Try a different filter, or check back once your trainer assigns more workouts."
              />
            </div>
          ) : (
            <div className="space-y-4">
              {filteredWorkouts.map((w) => {
                const isExpanded = expandedId === w.id;
                return (
                  <div key={w.id} className="card overflow-hidden transition-all !p-0">
                    {/* Top Summary Bar */}
                    <div
                      onClick={() => setExpandedId(isExpanded ? null : w.id)}
                      className="p-card sm:p-card flex flex-col sm:flex-row sm:items-center justify-between gap-6 cursor-pointer hover:bg-neutral-50/50"
                    >
                      <div className="flex items-start gap-6">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          w.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600' : 'bg-[var(--color-brand-bg)] text-purple-600'
                        }`}>
                          <Dumbbell className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base sm:text-lg font-bold text-[var(--color-text-main)]">{w.workoutTitle}</h3>
                            {statusBadge(w.status)}
                          </div>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--color-text-muted)] mt-1.5">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" /> {w.scheduledDate}
                            </span>
                            <span>{w.exercises.length} Exercises</span>
                            <span>~{estimateMinutes(w.exercises)} min</span>
                            <span>Coach {w.assignedByTrainerName || 'IronCore Staff'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-center">
                        {w.status !== 'COMPLETED' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkComplete(w.id);
                            }}
                            disabled={actionLoading === w.id}
                            className="btn btn-primary btn-sm"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>{actionLoading === w.id ? 'Saving...' : 'Mark Complete'}</span>
                          </button>
                        )}
                        <button className="text-[var(--color-text-muted)] hover:text-neutral-700">
                          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    {/* Expanded Exercises Breakdown */}
                    {isExpanded && (
                      <div className="px-6 pb-6 pt-2 border-t border-neutral-100 bg-neutral-50/40">
                        {w.notes && (
                          <div className="mb-4 p-4 rounded-lg bg-white border border-[var(--color-border-main)]/80 text-xs text-neutral-700">
                            <span className="font-bold text-[var(--color-text-main)]">Trainer Instructions: </span>
                            {w.notes}
                          </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {w.exercises.map((ex, idx) => (
                            <ExerciseCard key={ex.id || idx} exercise={ex} />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
