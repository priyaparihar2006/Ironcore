import React, { useEffect, useState } from 'react';
import { Dumbbell, Plus, Trash2, CheckCircle2, Clock, X, AlertCircle } from 'lucide-react';
import { apiRequest } from '../../lib/api';
import { WorkoutPlanTemplate, ExerciseItem } from '../../types';

export const TrainerWorkoutPlansPage: React.FC = () => {
  const [plans, setPlans] = useState<WorkoutPlanTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  // Create Modal State
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [targetMuscle, setTargetMuscle] = useState('Full Body');
  const [description, setDescription] = useState('');
  const [exercises, setExercises] = useState<ExerciseItem[]>([
    {
      id: 'ex-1',
      name: 'Barbell Back Squat',
      sets: 4,
      reps: 8,
      weightKg: 85,
      restSeconds: 120,
      targetMuscle: 'Quadriceps',
    },
  ]);
  const [creating, setCreating] = useState(false);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      // Backend key is `workoutPlans` (see server/api.ts GET /trainer/workouts).
      const res = await apiRequest<{ workoutPlans: WorkoutPlanTemplate[] }>('/trainer/workouts');
      setPlans(res.workoutPlans || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const addExerciseRow = () => {
    setExercises([
      ...exercises,
      {
        id: `ex-${Date.now()}`,
        name: 'Dumbbell Incline Press',
        sets: 3,
        reps: 10,
        weightKg: 24,
        restSeconds: 90,
        targetMuscle: 'Upper Chest',
      },
    ]);
  };

  const removeExerciseRow = (index: number) => {
    setExercises(exercises.filter((_, i) => i !== index));
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || exercises.length === 0) return;

    setCreating(true);
    try {
      await apiRequest('/trainer/workouts', {
        method: 'POST',
        body: JSON.stringify({
          title,
          targetMuscle,
          description,
          exercises,
        }),
      });

      setShowModal(false);
      setTitle('');
      setDescription('');
      await fetchPlans();
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-section">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text-main)]">
            Workout Regimen Vault
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            Build and curate master training templates, exercise sequences, and progressive load schedules.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-6 py-3 rounded-lg bg-[var(--color-primary)] text-[var(--color-text-main)] text-xs sm:text-sm font-bold flex items-center gap-2 hover:bg-neutral-800 transition-all self-start sm:self-center cursor-pointer shadow-sm shadow-purple-950/5"
        >
          <Plus className="w-4 h-4" />
          <span>New Workout Template</span>
        </button>
      </div>

      {/* Plans Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
          <div className="h-64 bg-neutral-200 rounded-3xl"></div>
          <div className="h-64 bg-neutral-200 rounded-3xl"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="bg-white rounded-lg p-card sm:p-card border border-[var(--color-border-main)]/80 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-3 py-1 rounded-full bg-purple-100 text-[var(--color-text-main)] text-xs font-bold uppercase">
                    {plan.targetMuscle}
                  </span>
                  <span className="text-xs font-semibold text-[var(--color-text-muted)]">
                    {plan.exercises.length} Exercises
                  </span>
                </div>

                <h3 className="text-xl font-bold text-[var(--color-text-main)]">{plan.title}</h3>
                <p className="text-xs text-[var(--color-text-muted)] mt-1 mb-6 leading-relaxed">
                  {plan.description}
                </p>

                <div className="space-y-2 border-t border-neutral-100 pt-4">
                  {plan.exercises.map((ex, i) => (
                    <div key={ex.id || i} className="flex items-center justify-between text-xs py-2">
                      <span className="font-bold text-[var(--color-text-main)]">{ex.name}</span>
                      <span className="font-mono text-[var(--color-text-muted)]">
                        {ex.sets} × {ex.reps} {ex.weightKg ? `@ ${ex.weightKg}kg` : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Plan Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-card">
          <div className="bg-white rounded-lg p-card sm:p-card max-w-2xl w-full shadow-sm border border-[var(--color-border-main)] max-h-[90vh] overflow-y-auto animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-[var(--color-text-main)]">Build New Workout Routine</h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-full hover:bg-neutral-100">
                <X className="w-5 h-5 text-[var(--color-text-muted)]" />
              </button>
            </div>

            <form onSubmit={handleCreatePlan} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-[var(--color-text-main)] mb-1">Routine Title *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Posterior Chain & Glute Specialization"
                    className="w-full px-4 py-3 rounded-xl border border-[var(--color-border-main)] text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--color-text-main)] mb-1">Target Anatomy *</label>
                  <input
                    type="text"
                    required
                    value={targetMuscle}
                    onChange={(e) => setTargetMuscle(e.target.value)}
                    placeholder="e.g. Chest / Back / Delts"
                    className="w-full px-4 py-3 rounded-xl border border-[var(--color-border-main)] text-xs font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--color-text-main)] mb-1">Description / Protocol</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Hypertrophy focus with 2 RIR (reps in reserve)."
                  className="w-full px-4 py-3 rounded-xl border border-[var(--color-border-main)] text-xs font-medium"
                />
              </div>

              {/* Dynamic Exercise Rows */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-600">
                    Exercise Sequence ({exercises.length})
                  </span>
                  <button
                    type="button"
                    onClick={addExerciseRow}
                    className="text-xs font-bold text-[var(--color-text-main)] hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Exercise
                  </button>
                </div>

                <div className="space-y-3">
                  {exercises.map((ex, idx) => (
                    <div key={ex.id || idx} className="p-4 rounded-lg bg-[var(--color-brand-bg)] border border-[var(--color-border-main)] flex flex-wrap gap-2 items-center">
                      <input
                        type="text"
                        value={ex.name}
                        onChange={(e) => {
                          const updated = [...exercises];
                          updated[idx].name = e.target.value;
                          setExercises(updated);
                        }}
                        placeholder="Exercise name"
                        className="flex-1 min-w-[150px] px-3 py-2 rounded-lg border border-[var(--color-border-main)] bg-white text-xs font-bold"
                      />
                      <input
                        type="number"
                        value={ex.sets}
                        onChange={(e) => {
                          const updated = [...exercises];
                          updated[idx].sets = parseInt(e.target.value, 10) || 1;
                          setExercises(updated);
                        }}
                        placeholder="Sets"
                        className="w-16 px-2 py-2 rounded-lg border border-[var(--color-border-main)] bg-white text-xs font-mono"
                      />
                      <input
                        type="number"
                        value={ex.reps}
                        onChange={(e) => {
                          const updated = [...exercises];
                          updated[idx].reps = parseInt(e.target.value, 10) || 1;
                          setExercises(updated);
                        }}
                        placeholder="Reps"
                        className="w-16 px-2 py-2 rounded-lg border border-[var(--color-border-main)] bg-white text-xs font-mono"
                      />
                      <input
                        type="number"
                        value={ex.weightKg || ''}
                        onChange={(e) => {
                          const updated = [...exercises];
                          updated[idx].weightKg = parseFloat(e.target.value) || 0;
                          setExercises(updated);
                        }}
                        placeholder="Load (kg)"
                        className="w-20 px-2 py-2 rounded-lg border border-[var(--color-border-main)] bg-white text-xs font-mono"
                      />
                      {exercises.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeExerciseRow(idx)}
                          className="p-2 text-[var(--color-text-muted)] hover:text-red-600 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={creating}
                className="w-full py-4 rounded-lg bg-[var(--color-primary)] text-[var(--color-text-main)] text-xs font-bold hover:bg-neutral-800 transition-colors cursor-pointer mt-4"
              >
                {creating ? 'Saving Routine...' : 'Save Routine to Vault'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
