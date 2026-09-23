import { ValidationInput, useFormValidation } from '../../components/ValidationInput';
import { weightError, numberError } from '../../lib/validation';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Scale,
  Flame,
  Footprints,
  Plus,
  Zap,
  AlertCircle,
  X,
  TrendingUp,
} from 'lucide-react';
import { apiRequest } from '../../lib/api';
import { ProgressEntry } from '../../types';

export const UserProgressPage: React.FC = () => {
  const [records, setRecords] = useState<ProgressEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State — inputs start empty so we never log demo numbers by accident.
  const [showModal, setShowModal] = useState(false);
  const [weightKg, setWeightKg] = useState('');
  const [caloriesBurned, setCaloriesBurned] = useState('');
  const [steps, setSteps] = useState('');
  const [strengthScore, setStrengthScore] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchProgress = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiRequest<{ records: ProgressEntry[] }>('/user/progress');
      setRecords(res.records || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load progress records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProgress();
  }, []);

  // Always work with records in chronological order regardless of API order.
  const sorted = useMemo(
    () =>
      [...records].sort(
        (a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id)
      ),
    [records]
  );

  const latestRecord = sorted[sorted.length - 1];
  const earliestRecord = sorted[0];
  const weightDelta =
    sorted.length > 1
      ? Number((latestRecord.weightKg - earliestRecord.weightKg).toFixed(1))
      : null;

  const avgSteps =
    sorted.length > 0
      ? Math.round(sorted.reduce((sum, r) => sum + r.steps, 0) / sorted.length)
      : null;
  const avgCalories =
    sorted.length > 0
      ? Math.round(sorted.reduce((sum, r) => sum + r.caloriesBurned, 0) / sorted.length)
      : null;

  // Chart bounds derived purely from the user's own data.
  const weights = sorted.map((r) => r.weightKg);
  const maxWeight = weights.length ? Math.max(...weights) : 0;
  const minWeight = weights.length ? Math.min(...weights) : 0;

  const validation = useFormValidation({ weightKg: weightError(weightKg), caloriesBurned: numberError(caloriesBurned, 'Calories burned', 0, 20000), steps: numberError(steps, 'Steps', 0, 200000), strengthScore: numberError(strengthScore, 'Strength score', 0, 100), notes: notes.length > 2000 ? 'Notes must not exceed 2000 characters.' : undefined });

  const resetForm = () => {
    validation.reset();
    setWeightKg('');
    setCaloriesBurned('');
    setSteps('');
    setStrengthScore('');
    setNotes('');
    setFormError(null);
  };

  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (submitting || !validation.validate()) return;
    const weight = weightKg.trim();
    const cals = caloriesBurned === '' ? 0 : Number(caloriesBurned);
    const stepCount = steps === '' ? 0 : Number(steps);
    const strength = strengthScore === '' ? 0 : Number(strengthScore);

    setSubmitting(true);
    try {
      await apiRequest('/user/progress', {
        method: 'POST',
        body: JSON.stringify({
          weightKg: weight,
          caloriesBurned: cals,
          steps: stepCount,
          strengthScore: strength,
          notes,
        }),
      });
      setShowModal(false);
      resetForm();
      await fetchProgress();
    } catch (err) {
      validation.server(err);
      setFormError(err instanceof Error ? err.message : 'Could not save progress entry.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-section">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text-main)]">
            Body Composition & Progress
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            Track weight trendlines, strength evolution, step counts, and caloric expenditure over time.
          </p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="px-6 py-3 rounded-lg bg-[var(--color-primary)] text-[var(--color-text-main)] text-xs sm:text-sm font-bold flex items-center gap-2 hover:bg-neutral-800 transition-all self-start sm:self-center cursor-pointer shadow-sm shadow-purple-950/5"
        >
          <Plus className="w-4 h-4" />
          <span>Log Progress Entry</span>
        </button>
      </div>

      {loading ? (
        <div className="space-y-section animate-pulse">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 bg-neutral-200 rounded-3xl" />
            ))}
          </div>
          <div className="h-64 bg-neutral-200 rounded-lg" />
          <div className="h-72 bg-neutral-200 rounded-lg" />
        </div>
      ) : error ? (
        <div className="p-card rounded-3xl bg-red-50 border border-red-200 text-red-700 flex flex-col items-center text-center">
          <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
          <h2 className="text-lg font-bold">Error loading progress</h2>
          <p className="text-sm text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchProgress}
            className="px-6 py-2 rounded-xl bg-red-600 text-white text-xs font-bold"
          >
            Retry
          </button>
        </div>
      ) : sorted.length === 0 ? (
        <div className="p-12 rounded-3xl bg-white border border-[var(--color-border-main)] text-center">
          <TrendingUp className="w-12 h-12 mx-auto text-neutral-300 mb-3" />
          <h3 className="text-lg font-bold text-[var(--color-text-main)]">No progress data yet</h3>
          <p className="text-xs text-[var(--color-text-muted)] max-w-sm mx-auto mt-1">
            Log your first entry to start building your weight, strength, and activity history.
          </p>
        </div>
      ) : (
        <>
          {/* Metric Cards Summary */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-card rounded-3xl border border-[var(--color-border-main)]/80 shadow-sm">
              <div className="flex items-center justify-between text-[var(--color-text-muted)] mb-2">
                <span className="text-xs font-bold uppercase text-[var(--color-text-muted)]">Current Weight</span>
                <Scale className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-2xl font-bold text-[var(--color-text-main)]">
                {latestRecord.weightKg} kg
              </div>
              <div
                className={`text-xs font-bold mt-1 ${
                  weightDelta === null
                    ? 'text-[var(--color-text-muted)]'
                    : weightDelta < 0
                    ? 'text-emerald-600'
                    : weightDelta > 0
                    ? 'text-orange-600'
                    : 'text-[var(--color-text-muted)]'
                }`}
              >
                {weightDelta === null
                  ? 'First entry logged'
                  : weightDelta === 0
                  ? 'No change overall'
                  : `${weightDelta < 0 ? '↓' : '↑'} ${weightDelta > 0 ? '+' : ''}${weightDelta} kg overall`}
              </div>
            </div>

            <div className="bg-white p-card rounded-3xl border border-[var(--color-border-main)]/80 shadow-sm">
              <div className="flex items-center justify-between text-[var(--color-text-muted)] mb-2">
                <span className="text-xs font-bold uppercase text-[var(--color-text-muted)]">Strength Index</span>
                <Zap className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-bold text-[var(--color-text-main)]">
                {latestRecord.strengthScore} <span className="text-xs text-[var(--color-text-muted)]">/ 100</span>
              </div>
              <div className="text-xs font-bold text-[var(--color-text-muted)] mt-1">
                Latest recorded score
              </div>
            </div>

            <div className="bg-white p-card rounded-3xl border border-[var(--color-border-main)]/80 shadow-sm">
              <div className="flex items-center justify-between text-[var(--color-text-muted)] mb-2">
                <span className="text-xs font-bold uppercase text-[var(--color-text-muted)]">Avg Daily Steps</span>
                <Footprints className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-bold text-[var(--color-text-main)]">
                {avgSteps !== null ? avgSteps.toLocaleString() : '—'}
              </div>
              <div className="text-xs font-bold text-[var(--color-text-muted)] mt-1">
                Across {sorted.length} {sorted.length === 1 ? 'entry' : 'entries'}
              </div>
            </div>

            <div className="bg-white p-card rounded-3xl border border-[var(--color-border-main)]/80 shadow-sm">
              <div className="flex items-center justify-between text-[var(--color-text-muted)] mb-2">
                <span className="text-xs font-bold uppercase text-[var(--color-text-muted)]">Avg Burn Rate</span>
                <Flame className="w-4 h-4 text-orange-500" />
              </div>
              <div className="text-2xl font-bold text-[var(--color-text-main)]">
                {avgCalories !== null ? avgCalories.toLocaleString() : '—'} kcal
              </div>
              <div className="text-xs font-bold text-[var(--color-text-muted)] mt-1">
                Across {sorted.length} {sorted.length === 1 ? 'entry' : 'entries'}
              </div>
            </div>
          </div>

          {/* Visual Weight Trend Visualization */}
          <div className="bg-white p-card sm:p-card rounded-xl border border-[var(--color-border-main)] shadow-sm/80 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-[var(--color-text-main)]">Weight Trend Curve</h2>
                <p className="text-xs text-[var(--color-text-muted)] mt-1">Historical body mass progression</p>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-[var(--color-text-muted)]">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-600 inline-block"></span>
                <span>Recorded Weight (kg)</span>
              </div>
            </div>

            {/* Dynamic SVG chart */}
            <div className="h-48 w-full relative flex items-end pt-6 pb-2">
              <div className="w-full flex items-end justify-between gap-2 sm:gap-6 h-36">
                {sorted.map((r) => {
                  const heightPercent =
                    maxWeight === minWeight
                      ? 50
                      : Math.max(
                          15,
                          Math.min(
                            100,
                            ((r.weightKg - minWeight + 1) / (maxWeight - minWeight + 2)) * 100
                          )
                        );

                  return (
                    <div key={r.id} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                      <span className="text-xs font-bold text-[var(--color-text-main)] group-hover:scale-110 transition-transform">
                        {r.weightKg}
                      </span>
                      <div className="w-full max-w-[48px] bg-purple-100 rounded-t-xl group-hover:bg-purple-600 transition-colors relative overflow-hidden"
                           style={{ height: `${heightPercent}%` }}>
                        <div className="absolute inset-x-0 top-0 h-1.5 bg-purple-700"></div>
                      </div>
                      <span className="text-xs font-medium text-[var(--color-text-muted)] truncate max-w-[50px]">
                        {r.date.split('-').slice(1).join('/')}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Progress History Table */}
          <div className="bg-white rounded-xl border border-[var(--color-border-main)] shadow-sm/80 shadow-sm overflow-hidden">
            <div className="p-card border-b border-neutral-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-[var(--color-text-main)]">Recorded Progress Logs</h2>
              <span className="text-xs font-bold text-[var(--color-text-muted)]">{sorted.length} Entries</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-neutral-50/70 text-[var(--color-text-muted)] uppercase tracking-wider font-bold border-b border-neutral-100">
                    <th className="py-3 px-6">Date</th>
                    <th className="py-3 px-6">Weight (kg)</th>
                    <th className="py-3 px-6">Calories Burned</th>
                    <th className="py-3 px-6">Steps</th>
                    <th className="py-3 px-6">Strength Score</th>
                    <th className="py-3 px-6">Status</th>
                    <th className="py-3 px-6">Coach Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {sorted.slice().reverse().map((rec) => (
                    <tr key={rec.id} className="hover:bg-neutral-50/50">
                      <td className="py-4 px-6 font-bold text-[var(--color-text-main)]">{rec.date}</td>
                      <td className="py-4 px-6 font-bold text-[var(--color-text-main)]">{rec.weightKg} kg</td>
                      <td className="py-4 px-6 text-neutral-700">{rec.caloriesBurned} kcal</td>
                      <td className="py-4 px-6 text-neutral-700">{rec.steps.toLocaleString()}</td>
                      <td className="py-4 px-6 font-bold text-[var(--color-text-main)]">{rec.strengthScore}/100</td>
                      <td className="py-4 px-6">
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                          Logged
                        </span>
                      </td>
                      <td className="py-4 px-6 text-[var(--color-text-muted)] italic max-w-xs truncate">
                        {rec.notes || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Log Progress Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-card">
          <div className="bg-white rounded-lg p-card sm:p-card max-w-md w-full shadow-sm border border-[var(--color-border-main)] animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-[var(--color-text-main)]">Log Progress Entry</h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-full hover:bg-neutral-100">
                <X className="w-5 h-5 text-[var(--color-text-muted)]" />
              </button>
            </div>

            <form noValidate onSubmit={handleAddEntry} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[var(--color-text-main)] mb-1">Weight (kg)</label>
                  <ValidationInput {...validation.field('weightKg', 'Weight (kg)')}
                    type="text"
                    required
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-[var(--color-border-main)] text-sm font-bold focus:ring-2 focus:ring-blue-500"
                  inputMode="decimal" maxLength={16} min={20} max={300} step="0.1" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--color-text-main)] mb-1">Calories Burned</label>
                  <ValidationInput {...validation.field('caloriesBurned', 'Calories burned')}
                    type="text"
                    value={caloriesBurned}
                    onChange={(e) => setCaloriesBurned(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-[var(--color-border-main)] text-sm font-bold focus:ring-2 focus:ring-blue-500"
                  inputMode="numeric" maxLength={6} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[var(--color-text-main)] mb-1">Daily Steps</label>
                  <ValidationInput {...validation.field('steps', 'Daily steps')}
                    type="text"
                    value={steps}
                    onChange={(e) => setSteps(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-[var(--color-border-main)] text-sm font-bold focus:ring-2 focus:ring-blue-500"
                  inputMode="numeric" maxLength={7} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--color-text-main)] mb-1">Strength Score (0-100)</label>
                  <ValidationInput {...validation.field('strengthScore', 'Strength score')}
                    type="text"
                    value={strengthScore}
                    onChange={(e) => setStrengthScore(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-[var(--color-border-main)] text-sm font-bold focus:ring-2 focus:ring-blue-500"
                  inputMode="numeric" maxLength={3} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--color-text-main)] mb-1">Notes / Reflection</label>
                <textarea maxLength={2000}
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Felt strong on bench press, energy high after morning meal."
                  className="w-full px-4 py-3 rounded-xl border border-[var(--color-border-main)] text-xs font-medium focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {formError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {formError}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 rounded-lg bg-[var(--color-primary)] text-[var(--color-text-main)] text-xs font-bold hover:bg-neutral-800 transition-colors cursor-pointer disabled:opacity-50"
              >
                {submitting ? 'Recording...' : 'Save Progress Entry'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
