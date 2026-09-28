import { KpiCard } from '../../components/dashboard/KpiCard';
import { Badge } from '../../components/dashboard/Badge';
import { EmptyState } from '../../components/dashboard/EmptyState';
import { LineChart } from '../../components/charts/LineChart';
import { PageHeader } from '../../components/dashboard/PageHeader';
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
      <PageHeader
        title="Progress"
        subtitle="Track weight, strength, steps and calories over time."
        actions={
          <>
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="btn btn-primary"
            >
              <Plus className="w-4 h-4" />
              <span>Log Progress Entry</span>
            </button>
          </>
        }
      />

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
        <div className="card">
          <EmptyState
            icon={TrendingUp}
            title="No progress data yet"
            body="Log your first entry to start building your weight, strength, and activity history."
            action={{ label: 'Log Progress Entry', onClick: () => { resetForm(); setShowModal(true); } }}
          />
        </div>
      ) : (
        <>
          {/* Metric Cards Summary */}
          <div className="kpi-grid">
            <KpiCard
              label="Current Weight"
              value={latestRecord.weightKg}
              unit="kg"
              support={
                weightDelta === null
                  ? 'First entry logged'
                  : weightDelta === 0
                  ? 'No change overall'
                  : `${weightDelta < 0 ? '↓' : '↑'} ${Math.abs(weightDelta)} kg overall`
              }
              tone={weightDelta === null || weightDelta === 0 ? 'neutral' : weightDelta < 0 ? 'positive' : 'negative'}
            />
            <KpiCard label="Strength Index" value={latestRecord.strengthScore} unit="/ 100" support="Latest recorded score" />
            <KpiCard
              label="Avg Daily Steps"
              value={avgSteps !== null ? avgSteps.toLocaleString() : '—'}
              support={`Across ${sorted.length} ${sorted.length === 1 ? 'entry' : 'entries'}`}
            />
            <KpiCard
              label="Avg Burn Rate"
              value={avgCalories !== null ? avgCalories.toLocaleString() : '—'}
              unit="kcal"
              support={`Across ${sorted.length} ${sorted.length === 1 ? 'entry' : 'entries'}`}
            />
          </div>

          {/* Visual Weight Trend Visualization */}
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-[var(--color-text-main)]">Weight Trend</h2>
                <p className="text-xs text-[var(--color-text-muted)] mt-1">Historical body mass progression</p>
              </div>
            </div>

            <LineChart
              data={sorted.map((r) => ({ label: r.date.split('-').slice(1).join('/'), value: r.weightKg }))}
              unit=" kg"
            />
          </div>

          {/* Progress History Table */}
          <div className="card overflow-hidden !p-0">
            <div className="p-card border-b border-neutral-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-[var(--color-text-main)]">Recorded Progress Logs</h2>
              <span className="text-xs font-bold text-[var(--color-text-muted)]">{sorted.length} Entries</span>
            </div>

            <div className="overflow-x-auto">
              <table className="table-clean">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Weight (kg)</th>
                    <th>Calories Burned</th>
                    <th>Steps</th>
                    <th>Strength Score</th>
                    <th>Status</th>
                    <th>Coach Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.slice().reverse().map((rec) => (
                    <tr key={rec.id} className="hover:bg-neutral-50/50">
                      <td className="font-bold text-[var(--color-text-main)]">{rec.date}</td>
                      <td className="font-bold text-[var(--color-text-main)]">{rec.weightKg} kg</td>
                      <td className="text-neutral-700">{rec.caloriesBurned} kcal</td>
                      <td className="text-neutral-700">{rec.steps.toLocaleString()}</td>
                      <td className="font-bold text-[var(--color-text-main)]">{rec.strengthScore}/100</td>
                      <td>
                        <Badge tone="success">Logged</Badge>
                      </td>
                      <td className="text-[var(--color-text-muted)] italic max-w-xs truncate">
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
          <div className="card max-w-md w-full animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-[var(--color-text-main)]">Log Progress Entry</h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-full hover:bg-neutral-100">
                <X className="w-5 h-5 text-[var(--color-text-muted)]" />
              </button>
            </div>

            <form noValidate onSubmit={handleAddEntry} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Weight (kg)</label>
                  <ValidationInput {...validation.field('weightKg', 'Weight (kg)')}
                    type="text"
                    required
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    className="form-input"
                  inputMode="decimal" maxLength={16} min={20} max={300} step="0.1" />
                </div>
                <div>
                  <label className="form-label">Calories Burned</label>
                  <ValidationInput {...validation.field('caloriesBurned', 'Calories burned')}
                    type="text"
                    value={caloriesBurned}
                    onChange={(e) => setCaloriesBurned(e.target.value)}
                    className="form-input"
                  inputMode="numeric" maxLength={6} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Daily Steps</label>
                  <ValidationInput {...validation.field('steps', 'Daily steps')}
                    type="text"
                    value={steps}
                    onChange={(e) => setSteps(e.target.value)}
                    className="form-input"
                  inputMode="numeric" maxLength={7} />
                </div>
                <div>
                  <label className="form-label">Strength Score (0-100)</label>
                  <ValidationInput {...validation.field('strengthScore', 'Strength score')}
                    type="text"
                    value={strengthScore}
                    onChange={(e) => setStrengthScore(e.target.value)}
                    className="form-input"
                  inputMode="numeric" maxLength={3} />
                </div>
              </div>

              <div>
                <label className="form-label">Notes / Reflection</label>
                <textarea maxLength={2000}
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Felt strong on bench press, energy high after morning meal."
                  className="form-input !h-auto py-3"
                />
              </div>

              {formError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {formError}
                </div>
              )}

              <button type="submit" disabled={submitting} className="btn btn-primary w-full">
                {submitting ? 'Recording...' : 'Save Progress Entry'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
