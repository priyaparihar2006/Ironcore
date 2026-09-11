import React, { useEffect, useState } from 'react';
import { Users, Dumbbell, Target, Scale, CheckCircle2, ChevronRight, X, AlertCircle } from 'lucide-react';
import { apiRequest } from '../../lib/api';
import { UserProfileData, WorkoutPlanTemplate } from '../../types';

export const TrainerClientsPage: React.FC = () => {
  const [clients, setClients] = useState<UserProfileData[]>([]);
  const [workoutPlans, setWorkoutPlans] = useState<WorkoutPlanTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<UserProfileData | null>(null);

  // Assign modal state
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Backend key is `workoutPlans` (see server/api.ts GET /trainer/workouts).
      const [cRes, pRes] = await Promise.all([
        apiRequest<{ clients: UserProfileData[] }>('/trainer/clients'),
        apiRequest<{ workoutPlans: WorkoutPlanTemplate[] }>('/trainer/workouts'),
      ]);
      setClients(cRes.clients || []);
      setWorkoutPlans(pRes.workoutPlans || []);
      if (cRes.clients?.length > 0) {
        setSelectedClient(cRes.clients[0]);
      }
      if (pRes.workoutPlans?.length > 0) {
        setSelectedPlanId(pRes.workoutPlans[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAssignWorkout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient || !selectedPlanId) return;

    setAssigning(true);
    try {
      // Backend route is /trainer/assign-workout and expects `clientId`
      // (see server/api.ts POST /trainer/assign-workout).
      await apiRequest('/trainer/assign-workout', {
        method: 'POST',
        body: JSON.stringify({
          clientId: selectedClient.userId,
          workoutPlanId: selectedPlanId,
          scheduledDate,
          notes,
        }),
      });

      setShowAssignModal(false);
      setNotes('');
      setSuccessToast(`Workout successfully assigned to ${selectedClient.name}!`);
      setTimeout(() => setSuccessToast(null), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="space-y-8">
      {successToast && (
        <div className="fixed top-6 right-6 z-50 bg-[#080512] text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-purple-500/20 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-bold">{successToast}</span>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#080512]">
          Assigned Athlete Profiles
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          Review physiological baselines, targets, and prescribe periodized workout regimens.
        </p>
      </div>

      {loading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-64 bg-neutral-200 rounded-3xl"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Athlete List (4 Cols) */}
          <div className="lg:col-span-4 space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-400 px-2">
              Athletes ({clients.length})
            </h2>
            {clients.map((c) => {
              const isSelected = selectedClient?.userId === c.userId;
              return (
                <div
                  key={c.userId}
                  onClick={() => setSelectedClient(c)}
                  className={`p-4 rounded-3xl border transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-[#080512] text-white border-[#080512] shadow-md'
                      : 'bg-white text-neutral-800 border-neutral-200/80 hover:bg-neutral-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                      isSelected ? 'bg-white/10 text-white' : 'bg-purple-100 text-purple-900'
                    }`}>
                      {c.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-sm leading-tight">{c.name}</div>
                      <div className={`text-xs mt-0.5 ${isSelected ? 'text-white/60' : 'text-neutral-400'}`}>
                        {c.fitnessGoal}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-neutral-400'}`} />
                </div>
              );
            })}
          </div>

          {/* Selected Athlete Dossier (8 Cols) */}
          <div className="lg:col-span-8">
            {selectedClient ? (
              <div className="bg-white rounded-[32px] p-6 sm:p-8 border border-neutral-200/80 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-100">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 px-2.5 py-1 rounded-full bg-purple-50">
                      Athlete Profile
                    </span>
                    <h2 className="text-2xl font-black text-[#080512] mt-1">{selectedClient.name}</h2>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      Contact: {selectedClient.phone || 'No phone recorded'} • Gender: {selectedClient.gender || 'Not specified'}
                    </p>
                  </div>

                  <button
                    onClick={() => setShowAssignModal(true)}
                    className="px-5 py-3 rounded-2xl bg-[#080512] text-white text-xs font-bold flex items-center gap-2 hover:bg-neutral-800 cursor-pointer shadow-md self-start sm:self-center"
                  >
                    <Dumbbell className="w-4 h-4 text-purple-300" />
                    <span>Assign Workout Plan</span>
                  </button>
                </div>

                {/* Biometrics Card */}
                <div>
                  <h3 className="text-sm font-bold text-[#080512] uppercase tracking-wider mb-3">
                    Biometric Measurements
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-100">
                      <span className="text-[10px] uppercase font-bold text-neutral-400">Current Weight</span>
                      <div className="text-lg font-black text-[#080512] mt-1">
                        {selectedClient.measurements?.currentWeightKg || 72} kg
                      </div>
                    </div>
                    <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-100">
                      <span className="text-[10px] uppercase font-bold text-neutral-400">Target Weight</span>
                      <div className="text-lg font-black text-emerald-700 mt-1">
                        {selectedClient.measurements?.targetWeightKg || 65} kg
                      </div>
                    </div>
                    <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-100">
                      <span className="text-[10px] uppercase font-bold text-neutral-400">Height</span>
                      <div className="text-lg font-black text-[#080512] mt-1">
                        {selectedClient.measurements?.heightCm || 178} cm
                      </div>
                    </div>
                    <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-100">
                      <span className="text-[10px] uppercase font-bold text-neutral-400">Body Fat %</span>
                      <div className="text-lg font-black text-[#080512] mt-1">
                        {selectedClient.measurements?.bodyFatPercent || 14.5}%
                      </div>
                    </div>
                  </div>
                </div>

                {/* Primary Objective */}
                <div className="p-5 rounded-2xl bg-purple-50 border border-purple-200/60">
                  <div className="flex items-center gap-2 text-xs font-bold text-purple-900 mb-1">
                    <Target className="w-4 h-4 text-purple-700" />
                    Athlete Goal Focus
                  </div>
                  <p className="text-sm font-black text-[#080512]">
                    {selectedClient.fitnessGoal}
                  </p>
                  <p className="text-xs text-neutral-600 mt-1">
                    Program recommended: Progressive overload compound movements with moderate tempo.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-neutral-400 bg-white rounded-3xl border border-neutral-200">
                Select an athlete to review details.
              </div>
            )}
          </div>

        </div>
      )}

      {/* Assign Modal */}
      {showAssignModal && selectedClient && (
        <div className="fixed inset-0 bg-[#080512]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] p-6 sm:p-8 max-w-md w-full shadow-2xl border border-neutral-200 animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-black text-[#080512]">Assign Workout Routine</h3>
                <p className="text-xs text-neutral-500 mt-0.5">To athlete: {selectedClient.name}</p>
              </div>
              <button onClick={() => setShowAssignModal(false)} className="p-1 rounded-full hover:bg-neutral-100">
                <X className="w-5 h-5 text-neutral-500" />
              </button>
            </div>

            <form onSubmit={handleAssignWorkout} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#080512] mb-1">Select Workout Template *</label>
                <select
                  value={selectedPlanId}
                  onChange={(e) => setSelectedPlanId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-xs font-bold"
                >
                  {workoutPlans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} ({p.targetMuscle})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#080512] mb-1">Execution Date *</label>
                <input
                  type="date"
                  required
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-xs font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#080512] mb-1">Coach Notes & Intensity Guidance</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Focus on keeping elbows tucked on bench press. 2 min rest between top working sets."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-xs font-medium"
                />
              </div>

              <button
                type="submit"
                disabled={assigning}
                className="w-full py-3.5 rounded-2xl bg-[#080512] text-white text-xs font-bold hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                {assigning ? 'Assigning...' : 'Assign to Athlete Portal'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
