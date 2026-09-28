import { PageHeader } from '../../components/dashboard/PageHeader';
import { Badge } from '../../components/dashboard/Badge';
import { EmptyState } from '../../components/dashboard/EmptyState';
import React, { useEffect, useState } from 'react';
import { Calendar } from 'lucide-react';
import { apiRequest } from '../../lib/api';
import { BookingSession } from '../../types';

function statusTone(status: BookingSession['status']): 'info' | 'success' | 'danger' | 'neutral' {
  if (status === 'CONFIRMED') return 'info';
  if (status === 'COMPLETED') return 'success';
  if (status === 'CANCELLED') return 'danger';
  return 'neutral';
}

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
        <div className="card">
          <EmptyState
            icon={Calendar}
            title="No sessions currently scheduled"
            body="New member bookings will appear here in real-time."
          />
        </div>
      ) : (
        <div className="card overflow-hidden !p-0">
          <div className="p-card border-b border-neutral-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-[var(--color-text-main)]">Session Roster</h2>
            <span className="text-xs font-bold text-[var(--color-text-muted)]">{sessions.length} Appointments</span>
          </div>

          <div className="overflow-x-auto">
            <table className="table-clean">
              <thead>
                <tr>
                  <th>Session Type</th>
                  <th>Date</th>
                  <th>Time Slot</th>
                  <th>Athlete</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => (
                  <tr key={s.id} className="hover:bg-neutral-50/50">
                    <td className="font-bold text-[var(--color-text-main)]">{s.sessionType}</td>
                    <td className="text-neutral-600">{s.date}</td>
                    <td className="font-mono font-medium text-[var(--color-text-main)]">{s.timeSlot}</td>
                    <td className="font-medium text-[var(--color-text-main)]">{s.userName}</td>
                    <td>
                      <Badge tone={statusTone(s.status)}>{s.status}</Badge>
                    </td>
                    <td className="text-right">
                      {s.status === 'CONFIRMED' && (
                        <div className="inline-flex items-center gap-2">
                          <button onClick={() => handleUpdateStatus(s.id, 'COMPLETED')} className="btn btn-primary btn-sm">
                            Mark Completed
                          </button>
                          <button onClick={() => handleUpdateStatus(s.id, 'CANCELLED')} className="btn btn-secondary btn-sm">
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
