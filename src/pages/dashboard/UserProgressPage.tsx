import React, { useEffect, useState } from 'react';
import {
  TrendingUp,
  Scale,
  Flame,
  Footprints,
  Plus,
  Zap,
  Calendar,
  AlertCircle,
  X,
  CheckCircle2,
} from 'lucide-react';
import { apiRequest } from '../../lib/api';
import { ProgressEntry } from '../../types';

export const UserProgressPage: React.FC = () => {
  const [records, setRecords] = useState<ProgressEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [weightKg, setWeightKg] = useState('72.0');
  const [caloriesBurned, setCaloriesBurned] = useState('1240');
  const [steps, setSteps] = useState('11980');
  const [strengthScore, setStrengthScore] = useState('85');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchProgress = async () => {
    try {
      setLoading(true);
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

  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiRequest('/user/progress', {
        method: 'POST',
        body: JSON.stringify({
          weightKg: parseFloat(weightKg),
          caloriesBurned: parseInt(caloriesBurned, 10),
          steps: parseInt(steps, 10),
          strengthScore: parseInt(strengthScore, 10),
          notes,
        }),
      });
      setShowModal(false);
      setNotes('');
      await fetchProgress();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // Compute metrics
  const latestRecord = records[records.length - 1];
  const earliestRecord = records[0];
  const weightDelta =
    latestRecord && earliestRecord
      ? (latestRecord.weightKg - earliestRecord.weightKg).toFixed(1)
      : '0';

  const maxWeight = Math.max(...records.map((r) => r.weightKg), 75);
  const minWeight = Math.min(...records.map((r) => r.weightKg), 65);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#080512]">
            Body Composition & Progress
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Track weight trendlines, strength evolution, step counts, and caloric expenditure over time.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-5 py-3 rounded-2xl bg-[#080512] text-white text-xs sm:text-sm font-bold flex items-center gap-2 hover:bg-neutral-800 transition-all self-start sm:self-center cursor-pointer shadow-lg shadow-purple-950/5"
        >
          <Plus className="w-4 h-4" />
          <span>Log Progress Entry</span>
        </button>
      </div>

      {/* Metric Cards Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-neutral-200/80 shadow-sm">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-bold uppercase text-neutral-500">Current Weight</span>
            <Scale className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-[#080512]">
            {latestRecord ? latestRecord.weightKg : 72} kg
          </div>
          <div className="text-[11px] font-bold text-emerald-600 mt-1">
            {Number(weightDelta) < 0 ? `↓ ${weightDelta} kg overall` : `+${weightDelta} kg`}
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-neutral-200/80 shadow-sm">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-bold uppercase text-neutral-500">Strength Index</span>
            <Zap className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-[#080512]">
            {latestRecord ? latestRecord.strengthScore : 85} <span className="text-xs text-neutral-400">/ 100</span>
          </div>
          <div className="text-[11px] font-bold text-neutral-500 mt-1">
            Upper 10th percentile
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-neutral-200/80 shadow-sm">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-bold uppercase text-neutral-500">Avg Daily Steps</span>
            <Footprints className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-[#080512]">
            {latestRecord ? latestRecord.steps.toLocaleString() : '11,980'}
          </div>
          <div className="text-[11px] font-bold text-emerald-600 mt-1">
            Active daily cadence
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-neutral-200/80 shadow-sm">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-bold uppercase text-neutral-500">Avg Burn Rate</span>
            <Flame className="w-4 h-4 text-orange-500" />
          </div>
          <div className="text-2xl font-black text-[#080512]">
            {latestRecord ? latestRecord.caloriesBurned.toLocaleString() : '1,240'} kcal
          </div>
          <div className="text-[11px] font-bold text-neutral-500 mt-1">
            Consistent caloric deficit
          </div>
        </div>
      </div>

      {/* Visual Weight Trend Visualization */}
      <div className="bg-white p-6 sm:p-8 rounded-[32px] border border-neutral-200/80 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-black text-[#080512]">Weight Trend Curve</h2>
            <p className="text-xs text-neutral-500 mt-0.5">Historical body mass progression</p>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-neutral-500">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-600 inline-block"></span>
            <span>Recorded Weight (kg)</span>
          </div>
        </div>

        {/* Dynamic SVG chart */}
        <div className="h-48 w-full relative flex items-end pt-6 pb-2">
          <div className="w-full flex items-end justify-between gap-2 sm:gap-4 h-36">
            {records.map((r) => {
              const heightPercent =
                maxWeight === minWeight
                  ? 50
                  : Math.max(15, Math.min(100, ((r.weightKg - minWeight + 1) / (maxWeight - minWeight + 2)) * 100));

              return (
                <div key={r.id} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  <span className="text-[10px] font-bold text-purple-900 group-hover:scale-110 transition-transform">
                    {r.weightKg}
                  </span>
                  <div className="w-full max-w-[48px] bg-purple-100 rounded-t-xl group-hover:bg-purple-600 transition-colors relative overflow-hidden"
                       style={{ height: `${heightPercent}%` }}>
                    <div className="absolute inset-x-0 top-0 h-1.5 bg-purple-700"></div>
                  </div>
                  <span className="text-[10px] font-medium text-neutral-400 truncate max-w-[50px]">
                    {r.date.split('-').slice(1).join('/')}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Progress History Table */}
      <div className="bg-white rounded-[32px] border border-neutral-200/80 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
          <h2 className="text-lg font-black text-[#080512]">Recorded Progress Logs</h2>
          <span className="text-xs font-bold text-neutral-400">{records.length} Entries</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-neutral-50/70 text-neutral-400 uppercase tracking-wider font-bold border-b border-neutral-100">
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
              {records.slice().reverse().map((rec) => (
                <tr key={rec.id} className="hover:bg-neutral-50/50">
                  <td className="py-4 px-6 font-bold text-[#080512]">{rec.date}</td>
                  <td className="py-4 px-6 font-black text-purple-900">{rec.weightKg} kg</td>
                  <td className="py-4 px-6 text-neutral-700">{rec.caloriesBurned} kcal</td>
                  <td className="py-4 px-6 text-neutral-700">{rec.steps.toLocaleString()}</td>
                  <td className="py-4 px-6 font-bold text-neutral-800">{rec.strengthScore}/100</td>
                  <td className="py-4 px-6">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      Logged
                    </span>
                  </td>
                  <td className="py-4 px-6 text-neutral-500 italic max-w-xs truncate">
                    {rec.notes || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Progress Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-[#080512]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] p-6 sm:p-8 max-w-md w-full shadow-2xl border border-neutral-200 animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black text-[#080512]">Log Progress Entry</h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-full hover:bg-neutral-100">
                <X className="w-5 h-5 text-neutral-500" />
              </button>
            </div>

            <form onSubmit={handleAddEntry} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#080512] mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm font-bold focus:ring-2 focus:ring-[#080512]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#080512] mb-1">Calories Burned</label>
                  <input
                    type="number"
                    required
                    value={caloriesBurned}
                    onChange={(e) => setCaloriesBurned(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm font-bold focus:ring-2 focus:ring-[#080512]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#080512] mb-1">Daily Steps</label>
                  <input
                    type="number"
                    required
                    value={steps}
                    onChange={(e) => setSteps(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm font-bold focus:ring-2 focus:ring-[#080512]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#080512] mb-1">Strength Score (0-100)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    value={strengthScore}
                    onChange={(e) => setStrengthScore(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm font-bold focus:ring-2 focus:ring-[#080512]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#080512] mb-1">Notes / Reflection</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Felt strong on bench press, energy high after morning meal."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-xs font-medium focus:ring-2 focus:ring-[#080512]"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 rounded-2xl bg-[#080512] text-white text-xs font-bold hover:bg-neutral-800 transition-colors cursor-pointer"
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
