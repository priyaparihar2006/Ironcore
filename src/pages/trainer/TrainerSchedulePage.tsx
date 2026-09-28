import { PageHeader } from '../../components/dashboard/PageHeader';
import React, { useEffect, useState } from 'react';
import { Calendar, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { apiRequest } from '../../lib/api';
import { BookingSession } from '../../types';

export const TrainerSchedulePage: React.FC = () => {
  const [sessions, setSessions] = useState<BookingSession[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSchedule = async () => {
    try {
      setLoading(true);
      const res = await apiRequest<{ sessions: BookingSession[] }>('/trainer/schedule');
      setSessions(res.sessions || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
  }, []);

  const handleUpdateStatus = async (bookingId: string, status: 'COMPLETED' | 'CANCELLED') => {
    try {
      await apiRequest(`/trainer/sessions/${bookingId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
      await fetchSchedule();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-section">
      {/* Header */}
      <PageHeader title="Schedule" subtitle="Booked sessions and assessments with your athletes." />

      {loading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-40 bg-neutral-200 rounded-3xl"></div>
        </div>
      ) : sessions.length === 0 ? (
        <div className="card p-12 text-center text-[var(--color-text-muted)]">
          <Calendar className="w-12 h-12 mx-auto text-neutral-300 mb-2" />
          <p className="text-sm font-bold text-neutral-700">No sessions currently scheduled</p>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">New member bookings will appear here in real-time.</p>
        </div>
      ) : (
        <div className="card overflow-hidden !p-0">
          <div className="p-card border-b border-neutral-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-[var(--color-text-main)]">Session Roster</h2>
            <span className="text-xs font-bold text-[var(--color-text-muted)]">{sessions.length} Appointments</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-neutral-50/80 text-[var(--color-text-muted)] uppercase font-bold border-b border-neutral-100">
                  <th className="py-4 px-6">Session Type</th>
                  <th className="py-4 px-6">Date</th>
                  <th className="py-4 px-6">Time Slot</th>
                  <th className="py-4 px-6">Athlete / Client ID</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {sessions.map((s) => (
                  <tr key={s.id} className="hover:bg-neutral-50/50">
                    <td className="py-4 px-6 font-bold text-[var(--color-text-main)]">{s.sessionType}</td>
                    <td className="py-4 px-6 text-neutral-600">{s.date}</td>
                    <td className="py-4 px-6 font-mono font-medium text-[var(--color-text-main)]">{s.timeSlot}</td>
                    <td className="py-4 px-6 font-mono text-[var(--color-text-muted)]">{s.userId}</td>
                    <td className="py-4 px-6">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                        s.status === 'CONFIRMED'
                          ? 'bg-purple-100 text-[var(--color-text-main)]'
                          : s.status === 'COMPLETED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      {s.status === 'CONFIRMED' && (
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => handleUpdateStatus(s.id, 'COMPLETED')}
                            className="px-3 py-2 rounded-lg bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 cursor-pointer"
                          >
                            Mark Completed
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(s.id, 'CANCELLED')}
                            className="px-3 py-2 rounded-lg bg-neutral-100 text-neutral-600 font-bold text-xs hover:bg-neutral-200 cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
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
};
