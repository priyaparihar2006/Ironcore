import React, { useEffect, useState } from 'react';
import { Shield, Star, Users, CheckCircle2, UserPlus, X } from 'lucide-react';
import { apiRequest } from '../../lib/api';
import { UserProfileData } from '../../types';

interface TrainerProfile {
  id: string;
  name: string;
  email: string;
  specialization: string;
  rating: number;
  assignedClientsCount: number;
}

export const AdminTrainersPage: React.FC = () => {
  const [trainers, setTrainers] = useState<TrainerProfile[]>([]);
  const [clients, setClients] = useState<UserProfileData[]>([]);
  const [loading, setLoading] = useState(true);

  // Assign Athlete to Trainer Modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedTrainer, setSelectedTrainer] = useState<TrainerProfile | null>(null);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tRes, cRes] = await Promise.all([
        apiRequest<{ trainers: TrainerProfile[] }>('/admin/trainers'),
        apiRequest<{ users: UserProfileData[] }>('/admin/users'),
      ]);
      setTrainers(tRes.trainers || []);
      const userList = (cRes.users || []).filter((u: any) => u.role === 'USER');
      setClients(userList);
      if (userList.length > 0) {
        setSelectedClientId(userList[0].userId);
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

  const handleAssignAthlete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTrainer || !selectedClientId) return;

    setAssigning(true);
    try {
      await apiRequest('/admin/trainers/assign-client', {
        method: 'POST',
        body: JSON.stringify({
          trainerId: selectedTrainer.id,
          userId: selectedClientId,
        }),
      });

      setShowAssignModal(false);
      setSuccessToast(`Athlete successfully assigned to Coach ${selectedTrainer.name}`);
      await fetchData();
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
          Master Coaching Staff & Assignments
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          Review accredited coaching staff, specialty disciplines, active caseloads, and client pairings.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
          <div className="h-48 bg-neutral-200 rounded-3xl"></div>
          <div className="h-48 bg-neutral-200 rounded-3xl"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {trainers.map((t) => (
            <div
              key={t.id}
              className="bg-white rounded-[32px] p-6 sm:p-8 border border-neutral-200/80 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-900 font-black text-lg flex items-center justify-center">
                      {t.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-[#080512]">{t.name}</h3>
                      <p className="text-xs text-neutral-400 font-medium">{t.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 bg-amber-50 text-amber-900 px-2.5 py-1 rounded-full text-xs font-bold">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    <span>{t.rating || 4.9}</span>
                  </div>
                </div>

                <div className="mt-5 p-4 rounded-2xl bg-neutral-50 border border-neutral-100 space-y-2">
                  <div className="text-xs font-bold text-neutral-700">
                    Specialty Discipline: <span className="text-purple-700">{t.specialization}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-neutral-500">
                    <Users className="w-4 h-4 text-neutral-400" />
                    <span>{t.assignedClientsCount} athletes currently coached</span>
                  </div>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-neutral-100">
                <button
                  onClick={() => {
                    setSelectedTrainer(t);
                    setShowAssignModal(true);
                  }}
                  className="w-full py-3 rounded-2xl bg-[#080512] text-white text-xs font-bold flex items-center justify-center gap-2 hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Assign Athlete to {t.name.split(' ')[0]}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Assign Modal */}
      {showAssignModal && selectedTrainer && (
        <div className="fixed inset-0 bg-[#080512]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] p-6 sm:p-8 max-w-md w-full shadow-2xl border border-neutral-200 animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-black text-[#080512]">Pair Athlete</h3>
                <p className="text-xs text-neutral-500 mt-0.5">Assign to Coach {selectedTrainer.name}</p>
              </div>
              <button onClick={() => setShowAssignModal(false)} className="p-1 rounded-full hover:bg-neutral-100">
                <X className="w-5 h-5 text-neutral-500" />
              </button>
            </div>

            <form onSubmit={handleAssignAthlete} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#080512] mb-1">Select Athlete *</label>
                <select
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-xs font-bold"
                >
                  {clients.map((c) => (
                    <option key={c.userId} value={c.userId}>
                      {c.name} ({c.fitnessGoal})
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={assigning}
                className="w-full py-3.5 rounded-2xl bg-[#080512] text-white text-xs font-bold hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                {assigning ? 'Confirming pairing...' : 'Confirm Assignment'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
