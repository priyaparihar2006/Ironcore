import React, { useEffect, useState } from 'react';
import { Dumbbell, CheckCircle2, Clock, Calendar, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { apiRequest } from '../../lib/api';
import { WorkoutAssignmentData } from '../../types';

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

  const filteredWorkouts = workouts.filter((w) => {
    if (filter === 'ALL') return true;
    return w.status === filter;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#080512]">
            My Workouts
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Access your assigned training regimens, track sets and load, and record completions.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex bg-neutral-100 p-1.5 rounded-2xl self-start">
          {(['ALL', 'PENDING', 'COMPLETED'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                filter === tab
                  ? 'bg-white text-[#080512] shadow-sm'
                  : 'text-neutral-500 hover:text-[#080512]'
              }`}
            >
              {tab === 'ALL' ? 'All Routines' : tab === 'PENDING' ? 'Active / Upcoming' : 'Completed'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 bg-neutral-200 rounded-3xl"></div>
          ))}
        </div>
      ) : error ? (
        <div className="p-8 rounded-3xl bg-red-50 border border-red-200 text-red-700 flex flex-col items-center text-center">
          <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
          <h2 className="text-lg font-bold">Error loading workouts</h2>
          <p className="text-sm text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchWorkouts}
            className="px-6 py-2 rounded-xl bg-red-600 text-white text-xs font-bold"
          >
            Retry
          </button>
        </div>
      ) : filteredWorkouts.length === 0 ? (
        <div className="p-12 rounded-3xl bg-white border border-neutral-200 text-center">
          <Dumbbell className="w-12 h-12 mx-auto text-neutral-300 mb-3" />
          <h3 className="text-lg font-bold text-neutral-800">No workouts assigned yet</h3>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto mt-1">
            Your personal trainer will configure and assign your next progressive overload phase soon.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredWorkouts.map((w) => {
            const isExpanded = expandedId === w.id;
            return (
              <div
                key={w.id}
                className="bg-white rounded-3xl border border-neutral-200/80 shadow-sm overflow-hidden transition-all"
              >
                {/* Top Summary Bar */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : w.id)}
                  className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-neutral-50/50"
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                      w.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600' : 'bg-purple-50 text-purple-600'
                    }`}>
                      <Dumbbell className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base sm:text-lg font-black text-[#080512]">{w.workoutTitle}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          w.status === 'COMPLETED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {w.status}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-500 mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" /> Scheduled: {w.scheduledDate}
                        </span>
                        <span>•</span>
                        <span>Coach: {w.assignedByTrainerName || 'IronCore Staff'}</span>
                        <span>•</span>
                        <span>{w.exercises.length} Exercises</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    {w.status !== 'COMPLETED' ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkComplete(w.id);
                        }}
                        disabled={actionLoading === w.id}
                        className="px-4 py-2 rounded-xl bg-[#080512] text-white text-xs font-bold flex items-center gap-1.5 hover:bg-neutral-800 transition-colors cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{actionLoading === w.id ? 'Saving...' : 'Mark Complete'}</span>
                      </button>
                    ) : (
                      <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> Finished
                      </span>
                    )}
                    <button className="text-neutral-400 hover:text-neutral-700">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Exercises Breakdown */}
                {isExpanded && (
                  <div className="px-6 pb-6 pt-2 border-t border-neutral-100 bg-neutral-50/40">
                    {w.notes && (
                      <div className="mb-4 p-3.5 rounded-2xl bg-white border border-neutral-200/80 text-xs text-neutral-700">
                        <span className="font-bold text-[#080512]">Trainer Instructions: </span>
                        {w.notes}
                      </div>
                    )}

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-neutral-200/80 text-neutral-400 font-bold uppercase tracking-wider">
                            <th className="pb-3">#</th>
                            <th className="pb-3">Exercise Name</th>
                            <th className="pb-3">Target Muscle</th>
                            <th className="pb-3">Sets</th>
                            <th className="pb-3">Reps</th>
                            <th className="pb-3">Working Load</th>
                            <th className="pb-3">Rest</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200/50">
                          {w.exercises.map((ex, idx) => (
                            <tr key={ex.id || idx} className="hover:bg-white/60">
                              <td className="py-3 font-mono text-neutral-400 font-bold">{idx + 1}</td>
                              <td className="py-3 font-black text-neutral-900">{ex.name}</td>
                              <td className="py-3 text-neutral-600">{ex.targetMuscle}</td>
                              <td className="py-3 font-bold text-neutral-800">{ex.sets}</td>
                              <td className="py-3 font-bold text-neutral-800">{ex.reps}</td>
                              <td className="py-3 font-bold text-purple-700">
                                {ex.weightKg ? `${ex.weightKg} kg` : 'Bodyweight'}
                              </td>
                              <td className="py-3 text-neutral-500 flex items-center gap-1">
                                <Clock className="w-3 h-3 text-neutral-400" />
                                <span>{ex.restSeconds}s</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
