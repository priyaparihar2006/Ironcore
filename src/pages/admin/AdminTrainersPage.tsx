import { PageHeader } from '../../components/dashboard/PageHeader';
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
    <div className="space-y-section">
      {successToast && (
        <div className="fixed top-8 right-6 z-50 bg-[var(--color-primary)] text-[var(--color-text-main)] px-6 py-3 rounded-lg shadow-sm flex items-center gap-3 border border-purple-500/20 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-bold">{successToast}</span>
        </div>
      )}

      {/* Header */}
      <PageHeader title="Trainers" subtitle="Review coaching staff, specialties, caseloads and client pairings." />

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
          <div className="h-48 bg-neutral-200 rounded-3xl"></div>
          <div className="h-48 bg-neutral-200 rounded-3xl"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {trainers.map((t) => (
            <div
              key={t.id}
              className="card flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-16 h-16 rounded-full bg-purple-100 text-[var(--color-text-main)] font-bold text-xl flex items-center justify-center shrink-0">
                      {t.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-lg font-bold text-[var(--color-text-main)] truncate">{t.name}</h3>
                      <p className="text-xs font-semibold text-purple-700 truncate">{t.specialization}</p>
                      <p className="text-xs text-[var(--color-text-muted)] truncate">{t.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 bg-amber-50 text-amber-900 px-3 py-1 rounded-full text-xs font-bold">
                    <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                    <span>{t.rating || 4.9}</span>
                  </div>
                </div>

                <div className="mt-6 p-card rounded-lg bg-[var(--color-brand-bg)] border border-neutral-100">
                  <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
                    <Users className="w-4 h-4 text-[var(--color-text-muted)]" />
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
                  className="w-full py-3 rounded-lg bg-[var(--color-primary)] text-[var(--color-text-main)] text-xs font-bold flex items-center justify-center gap-2 hover:bg-neutral-800 transition-colors cursor-pointer"
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-card">
          <div className="card max-w-md w-full animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-[var(--color-text-main)]">Pair Athlete</h3>
                <p className="text-xs text-[var(--color-text-muted)] mt-1">Assign to Coach {selectedTrainer.name}</p>
              </div>
              <button onClick={() => setShowAssignModal(false)} className="p-1 rounded-full hover:bg-neutral-100">
                <X className="w-5 h-5 text-[var(--color-text-muted)]" />
              </button>
            </div>

            <form onSubmit={handleAssignAthlete} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[var(--color-text-main)] mb-1">Select Athlete *</label>
                <select
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-[var(--color-border-main)] text-xs font-bold"
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
                className="w-full py-4 rounded-lg bg-[var(--color-primary)] text-[var(--color-text-main)] text-xs font-bold hover:bg-neutral-800 transition-colors cursor-pointer"
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
