import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Calendar, Dumbbell, AlertCircle } from 'lucide-react';
import { PageHeader } from '../../components/dashboard/PageHeader';
import { KpiCard } from '../../components/dashboard/KpiCard';
import { Card } from '../../components/dashboard/Card';
import { EmptyState } from '../../components/dashboard/EmptyState';
import { BarChart } from '../../components/charts/BarChart';
import { apiRequest } from '../../lib/api';
import { BookingSession, UserProfileData } from '../../types';

interface ClientProgress {
  userId: string;
  name: string;
  /** null when the client has no workout assignments yet. */
  workoutCompletionPercent: number | null;
  /** null when fewer than two progress entries are on file. */
  weightChangeKg: number | null;
}

interface TrainerOverviewData {
  stats: {
    assignedClientsCount: number;
    todaySessionsCount: number;
    totalPlansCount: number;
  };
  clients: UserProfileData[];
  todaySessions: BookingSession[];
  upcomingSessions?: BookingSession[];
  clientProgress?: ClientProgress[];
}

/** Confirmed-session counts for today and the next 6 days, from real booking dates. */
function sessionsPerDay(sessions: BookingSession[]): { label: string; value: number }[] {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return { key: d.toISOString().split('T')[0], label: d.toLocaleDateString('en-US', { weekday: 'short' }) };
  });
  return days.map(({ key, label }) => ({ label, value: sessions.filter((s) => s.date === key).length }));
}

export const TrainerOverviewPage: React.FC = () => {
  const [data, setData] = useState<TrainerOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOverview = async () => {
    try {
      setLoading(true);
      const res = await apiRequest<TrainerOverviewData>('/trainer/summary');
      setData(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load trainer overview.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  if (loading) {
    return (
      <div className="space-y-section animate-pulse">
        <div className="h-9 bg-neutral-200 rounded-xl w-64"></div>
        <div className="kpi-grid">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-neutral-200 rounded-2xl"></div>
          ))}
        </div>
        <div className="dashboard-grid">
          <div className="h-72 bg-neutral-200 rounded-2xl span-8"></div>
          <div className="h-72 bg-neutral-200 rounded-2xl span-4"></div>
        </div>
        <div className="h-64 bg-neutral-200 rounded-2xl"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="card bg-red-50 text-red-700 text-center">
        <AlertCircle className="w-8 h-8 mx-auto text-red-500 mb-2" />
        <h3 className="font-semibold">Error loading dashboard</h3>
        <p className="text-xs text-red-600 mb-4">{error}</p>
        <button onClick={fetchOverview} className="btn bg-red-600 text-white">
          Retry
        </button>
      </div>
    );
  }

  const { stats, clients, todaySessions, upcomingSessions, clientProgress } = data;
  const progressRows = clientProgress ?? [];

  return (
    <div className="space-y-section">
      <PageHeader
        title="Overview"
        subtitle="Your athletes, today's sessions and workout library."
        actions={
          <>
            <Link to="/trainer/clients" className="btn btn-secondary">
              <Users className="w-4 h-4" />
              <span>View Athletes</span>
            </Link>
            <Link to="/trainer/plans" className="btn btn-primary">
              <Dumbbell className="w-4 h-4" />
              <span>Create Plan</span>
            </Link>
          </>
        }
      />

      <div className="kpi-grid lg:grid-cols-3">
        <KpiCard label="Assigned Athletes" value={stats.assignedClientsCount} support="Active under your programming" />
        <KpiCard label="Today's Sessions" value={stats.todaySessionsCount} support="Private 1-on-1 consultations" />
        <KpiCard label="Workout Plans" value={stats.totalPlansCount} support="In your template library" />
      </div>

      <div className="dashboard-grid">
        <Card className="span-8" title="Sessions This Week" subtitle="Confirmed bookings, next 7 days">
          <BarChart data={sessionsPerDay(upcomingSessions ?? [])} />
        </Card>
        <Card className="span-4" title="Your Athletes" subtitle="Roster overview" link={{ to: '/trainer/clients', label: 'Manage all' }}>
          {clients.length === 0 ? (
            <p className="py-8 text-center card-subtitle">No athletes assigned yet.</p>
          ) : (
            <div className="divide-y divide-[var(--color-border-main)]">
              {clients.map((c) => (
                <div key={c.userId} className="py-3 first:pt-0 flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-[var(--color-primary)]/20 text-[var(--color-text-main)] font-semibold text-xs flex items-center justify-center shrink-0">
                    {c.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-[var(--color-text-main)] truncate">{c.name}</div>
                    <div className="text-xs text-[var(--color-text-muted)] truncate">{c.fitnessGoal}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card title="Today's Schedule" subtitle="Floor reservations and consultations" link={{ to: '/trainer/schedule', label: 'View Schedule' }}>
        {todaySessions.length === 0 ? (
          <EmptyState icon={Calendar} title="No sessions today" body="Your confirmed bookings for today will appear here." />
        ) : (
          <div className="divide-y divide-[var(--color-border-main)]">
            {todaySessions.map((s) => (
              <div key={s.id} className="py-3 first:pt-0 flex items-center gap-4">
                <span className="text-sm font-mono font-semibold text-[var(--color-text-main)] w-16 shrink-0">{s.timeSlot}</span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-[var(--color-text-main)] truncate">{s.userName}</div>
                  <div className="text-xs text-[var(--color-text-muted)] truncate">{s.sessionType}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card title="Member Progress" subtitle="Workout completion and weight change on file">
        {progressRows.length === 0 ? (
          <EmptyState icon={Users} title="No athletes yet" body="Progress for your assigned athletes will appear here once they start logging." />
        ) : (
          <div className="overflow-x-auto -mx-1">
            <table className="table-clean">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Workout Completion</th>
                  <th>Progress</th>
                </tr>
              </thead>
              <tbody>
                {progressRows.map((c) => (
                  <tr key={c.userId}>
                    <td className="font-medium text-[var(--color-text-main)]">{c.name}</td>
                    <td>{c.workoutCompletionPercent !== null ? `${c.workoutCompletionPercent}%` : '—'}</td>
                    <td className={
                      c.weightChangeKg === null ? 'text-[var(--color-text-muted)]'
                        : c.weightChangeKg < 0 ? 'text-emerald-700' : c.weightChangeKg > 0 ? 'text-orange-700' : 'text-[var(--color-text-muted)]'
                    }>
                      {c.weightChangeKg === null ? 'Not enough data' : `${c.weightChangeKg > 0 ? '+' : ''}${c.weightChangeKg} kg`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
