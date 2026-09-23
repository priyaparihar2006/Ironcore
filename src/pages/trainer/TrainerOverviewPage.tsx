import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Calendar, Dumbbell, Clock, CheckCircle2, ArrowRight, UserPlus, AlertCircle } from 'lucide-react';
import { apiRequest } from '../../lib/api';
import { BookingSession, UserProfileData } from '../../types';

interface TrainerOverviewData {
  stats: {
    assignedClientsCount: number;
    todaySessionsCount: number;
    totalPlansCount: number;
  };
  clients: UserProfileData[];
  todaySessions: BookingSession[];
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
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-neutral-200 rounded-xl w-64"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-neutral-200 rounded-3xl"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-card rounded-3xl bg-red-50 text-red-700 text-center">
        <AlertCircle className="w-8 h-8 mx-auto text-red-500 mb-2" />
        <h3 className="font-bold">Error loading dashboard</h3>
        <p className="text-xs text-red-600 mb-4">{error}</p>
        <button onClick={fetchOverview} className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold">
          Retry
        </button>
      </div>
    );
  }

  const { stats, clients, todaySessions } = data;

  return (
    <div className="space-y-section">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text-main)]">
            Coaching Operations Center
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            Monitor client progress, program periodized workouts, and coordinate private training sessions.
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            to="/trainer/plans"
            className="px-4 py-3 rounded-xl bg-[var(--color-primary)] text-[var(--color-text-main)] text-xs font-bold flex items-center gap-2 hover:bg-neutral-800"
          >
            <Dumbbell className="w-3.5 h-3.5" />
            <span>Create Plan</span>
          </Link>
          <Link
            to="/trainer/clients"
            className="px-4 py-3 rounded-xl bg-[var(--color-brand-bg)] text-[var(--color-text-main)] border border-[var(--color-border-main)] text-xs font-bold flex items-center gap-2 hover:bg-purple-100"
          >
            <Users className="w-3.5 h-3.5 text-[var(--color-text-main)]" />
            <span>View All Athletes</span>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-card rounded-3xl border border-[var(--color-border-main)]/80 shadow-sm">
          <div className="flex items-center justify-between text-[var(--color-text-muted)] mb-2">
            <span className="text-xs font-bold uppercase text-[var(--color-text-muted)]">Assigned Athletes</span>
            <Users className="w-5 h-5 text-purple-600" />
          </div>
          <div className="text-3xl font-bold text-[var(--color-text-main)]">{stats.assignedClientsCount}</div>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">Active under your programming</p>
        </div>

        <div className="bg-white p-card rounded-3xl border border-[var(--color-border-main)]/80 shadow-sm">
          <div className="flex items-center justify-between text-[var(--color-text-muted)] mb-2">
            <span className="text-xs font-bold uppercase text-[var(--color-text-muted)]">Today's Sessions</span>
            <Calendar className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-3xl font-bold text-[var(--color-text-main)]">{stats.todaySessionsCount}</div>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">Private 1-on-1 consultations</p>
        </div>

        <div className="bg-white p-card rounded-3xl border border-[var(--color-border-main)]/80 shadow-sm">
          <div className="flex items-center justify-between text-[var(--color-text-muted)] mb-2">
            <span className="text-xs font-bold uppercase text-[var(--color-text-muted)]">Curated Workouts</span>
            <Dumbbell className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-3xl font-bold text-[var(--color-text-main)]">{stats.totalPlansCount}</div>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">Available in template vault</p>
        </div>
      </div>

      {/* Main Grid: Today's Sessions & Quick Athletes */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Today's Schedule */}
        <div className="lg:col-span-7 bg-white rounded-lg p-card sm:p-card border border-[var(--color-border-main)]/80 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-[var(--color-text-main)]">Scheduled Sessions Today</h2>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">Floor reservations and consultations</p>
            </div>
            <Link to="/trainer/schedule" className="text-xs font-bold text-[var(--color-text-main)] hover:underline">
              Full Schedule →
            </Link>
          </div>

          {todaySessions.length === 0 ? (
            <div className="py-12 text-center text-[var(--color-text-muted)]">
              <Calendar className="w-10 h-10 mx-auto text-neutral-300 mb-2" />
              <p className="text-sm font-medium">No sessions booked for today.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todaySessions.map((s) => (
                <div key={s.id} className="p-card rounded-lg bg-[var(--color-brand-bg)] border border-[var(--color-border-main)]/60 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-sm text-[var(--color-text-main)]">{s.sessionType}</div>
                    <div className="text-xs text-[var(--color-text-muted)] mt-1">
                      Client ID: <span className="font-mono text-neutral-700">{s.userId}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-[var(--color-text-main)] block">{s.timeSlot}</span>
                    <span className="text-xs font-bold uppercase text-emerald-700">{s.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Assigned Athletes Quick List */}
        <div className="lg:col-span-5 bg-white rounded-lg p-card sm:p-card border border-[var(--color-border-main)]/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-[var(--color-text-main)]">Your Athletes</h2>
                <p className="text-xs text-[var(--color-text-muted)] mt-1">Roster overview</p>
              </div>
              <Link to="/trainer/clients" className="text-xs font-bold text-[var(--color-text-main)] hover:underline">
                Manage All →
              </Link>
            </div>

            <div className="space-y-3">
              {clients.map((c) => (
                <div key={c.userId} className="p-4 rounded-lg bg-neutral-50/70 border border-neutral-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[var(--color-primary)]/20 text-[var(--color-text-main)] font-bold text-xs flex items-center justify-center">
                      {c.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[var(--color-text-main)]">{c.name}</div>
                      <div className="text-xs text-[var(--color-text-muted)] font-semibold">{c.fitnessGoal}</div>
                    </div>
                  </div>
                  <Link
                    to="/trainer/clients"
                    className="px-3 py-1 rounded-lg bg-white border border-[var(--color-border-main)] text-xs font-bold text-neutral-700 hover:bg-neutral-100"
                  >
                    View
                  </Link>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-neutral-100">
            <Link
              to="/trainer/plans"
              className="w-full py-3 rounded-lg bg-[var(--color-primary)] text-[var(--color-text-main)] text-xs font-bold flex items-center justify-center gap-2 hover:bg-neutral-800 transition-colors"
            >
              <span>Assign Workout to Athlete</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

      </div>

    </div>
  );
};
