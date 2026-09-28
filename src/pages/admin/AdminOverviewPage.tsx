import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, DollarSign, AlertCircle, Star } from 'lucide-react';
import { PageHeader } from '../../components/dashboard/PageHeader';
import { KpiCard } from '../../components/dashboard/KpiCard';
import { Card } from '../../components/dashboard/Card';
import { LineChart } from '../../components/charts/LineChart';
import { BarChart } from '../../components/charts/BarChart';
import { DonutChart } from '../../components/charts/DonutChart';
import { apiRequest } from '../../lib/api';
import { UserPaymentRecord, UserProfileData } from '../../types';

interface AdminOverviewData {
  stats: {
    totalUsers: number;
    activeMembers: number;
    totalRevenue: number;
    activeTrainers: number;
    todayCheckins: number;
  };
  recentUsers: UserProfileData[];
  recentPayments: UserPaymentRecord[];
}

interface AdminAnalyticsData {
  stats: {
    monthlyRevenue: number;
    activeMemberships: number;
    expiringMemberships: number;
    newRegistrationsThisMonth: number;
  };
  charts: {
    userGrowth: { month: string; users: number; revenue: number }[];
    membershipDistribution: { name: string; count: number }[];
  };
}

interface TrainerPerformance {
  id: string;
  name: string;
  specialization: string;
  rating: number;
  assignedClientsCount: number;
}

export const AdminOverviewPage: React.FC = () => {
  const [data, setData] = useState<AdminOverviewData | null>(null);
  const [analytics, setAnalytics] = useState<AdminAnalyticsData | null>(null);
  const [trainers, setTrainers] = useState<TrainerPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOverview = async () => {
    try {
      setLoading(true);
      const [res, analyticsRes, trainersRes] = await Promise.all([
        apiRequest<AdminOverviewData>('/admin/overview'),
        apiRequest<AdminAnalyticsData>('/admin/analytics'),
        apiRequest<{ trainers: TrainerPerformance[] }>('/admin/trainers'),
      ]);
      setData(res);
      setAnalytics(analyticsRes);
      setTrainers(trainersRes.trainers || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load admin overview.');
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
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-neutral-200 rounded-2xl"></div>
          ))}
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="dashboard-grid">
            <div className="h-72 bg-neutral-200 rounded-2xl span-8"></div>
            <div className="h-72 bg-neutral-200 rounded-2xl span-4"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="card bg-red-50 text-red-700 text-center">
        <AlertCircle className="w-8 h-8 mx-auto text-red-500 mb-2" />
        <h3 className="font-semibold">Error loading admin metrics</h3>
        <p className="text-xs text-red-600 mb-4">{error}</p>
        <button onClick={fetchOverview} className="btn bg-red-600 text-white">
          Retry
        </button>
      </div>
    );
  }

  const { stats, recentUsers, recentPayments } = data;
  const membershipDistribution = (analytics?.charts?.membershipDistribution ?? []).filter((d) => d.count > 0);
  const topTrainers = [...trainers].sort((a, b) => b.assignedClientsCount - a.assignedClientsCount).slice(0, 6);

  return (
    <div className="space-y-section">
      <PageHeader
        title="Overview"
        subtitle="Memberships, revenue and facility activity at a glance."
        actions={
          <>
            <Link to="/admin/payments" className="btn btn-secondary">
              <DollarSign className="w-4 h-4" />
              <span>View Invoices</span>
            </Link>
            <Link to="/admin/users" className="btn btn-primary">
              <Users className="w-4 h-4" />
              <span>Manage Users</span>
            </Link>
          </>
        }
      />

      {/* Top KPIs. The spec's fourth slot ("Attendance") has no real backing
          data — this app has no check-in tracking (see /admin/overview's
          todayCheckins) — so Active Trainers stands in rather than showing a
          fabricated number. */}
      <div className="kpi-grid">
        <KpiCard label="Total Members" value={stats.totalUsers.toLocaleString()} support={`${stats.activeMembers.toLocaleString()} active`} />
        <KpiCard label="Active Memberships" value={(analytics?.stats?.activeMemberships ?? 0).toLocaleString()} support="Current paid plans" />
        <KpiCard label="Monthly Revenue" value={`$${(analytics?.stats?.monthlyRevenue ?? 0).toLocaleString()}`} support="This calendar month" />
        <KpiCard label="Active Trainers" value={stats.activeTrainers.toLocaleString()} support="Certified staff" />
      </div>

      <div className="dashboard-grid">
        <Card className="span-8" title="Member Growth" subtitle="Cumulative registered members, last 6 months">
          <LineChart data={(analytics?.charts?.userGrowth ?? []).map((m) => ({ label: m.month, value: m.users }))} />
        </Card>
        <Card className="span-4" title="Membership Mix" subtitle="Active plans by tier">
          <DonutChart data={membershipDistribution.map((d) => ({ label: d.name, value: d.count }))} centerLabel="Members" />
        </Card>
      </div>

      <div className="dashboard-grid">
        <Card className="span-8" title="Revenue" subtitle="Recorded revenue by month, last 6 months">
          <BarChart data={(analytics?.charts?.userGrowth ?? []).map((m) => ({ label: m.month, value: m.revenue }))} unit=" $" />
        </Card>
        <Card className="span-4 flex flex-col justify-between" title="Expiring Memberships" subtitle="Active plans lapsing within 30 days">
          <div>
            <p className="text-4xl font-bold text-[var(--color-text-main)]">{analytics?.stats?.expiringMemberships ?? 0}</p>
            <p className="text-sm text-[var(--color-text-muted)] mt-1">Renewal outreach may be worthwhile.</p>
          </div>
          <Link to="/admin/memberships" className="card-link mt-4">Review membership tiers →</Link>
        </Card>
      </div>

      <div className="dashboard-grid">
        <Card className="span-8" title="Trainer Performance" subtitle="Roster size and rating, by trainer" link={{ to: '/admin/trainers', label: 'Manage trainers' }}>
          {topTrainers.length === 0 ? (
            <p className="py-8 text-center card-subtitle">No trainers on staff yet.</p>
          ) : (
            <table className="table-clean">
              <thead>
                <tr>
                  <th>Trainer</th>
                  <th>Specialty</th>
                  <th>Assigned Clients</th>
                  <th>Rating</th>
                </tr>
              </thead>
              <tbody>
                {topTrainers.map((t) => (
                  <tr key={t.id}>
                    <td className="font-medium text-[var(--color-text-main)]">{t.name}</td>
                    <td className="text-[var(--color-text-muted)]">{t.specialization}</td>
                    <td>{t.assignedClientsCount}</td>
                    <td>
                      <span className="inline-flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                        {t.rating?.toFixed(1) ?? '—'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <Card className="span-4" title="Recent Transactions" subtitle="Membership dues and upgrades" link={{ to: '/admin/payments', label: 'All invoices' }}>
          {recentPayments.length === 0 ? (
            <p className="py-8 text-center card-subtitle">No payments recorded yet.</p>
          ) : (
            <div className="divide-y divide-[var(--color-border-main)]">
              {recentPayments.map((p) => (
                <div key={p.id} className="py-3 first:pt-0 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-[var(--color-text-main)] truncate">{p.planName}</div>
                    <div className="text-xs text-[var(--color-text-muted)] truncate">{p.date} • {p.paymentMethod}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-semibold text-emerald-700">+${p.amount}</div>
                    <span className="text-xs uppercase text-[var(--color-text-muted)]">{p.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card title="Recent Members" subtitle="Newly registered accounts" link={{ to: '/admin/users', label: 'View directory' }}>
        {recentUsers.length === 0 ? (
          <p className="py-8 text-center card-subtitle">No members have registered yet.</p>
        ) : (
          <div className="overflow-x-auto -mx-1">
            <table className="table-clean">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Goal</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentUsers.map((u) => (
                  <tr key={u.userId}>
                    <td>
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-[var(--color-primary)]/20 text-[var(--color-text-main)] font-semibold text-xs flex items-center justify-center shrink-0">
                          {u.name.charAt(0)}
                        </div>
                        <span className="font-medium text-[var(--color-text-main)] truncate">{u.name}</span>
                      </div>
                    </td>
                    <td className="text-[var(--color-text-muted)]">{u.fitnessGoal}</td>
                    <td>
                      <span className="badge badge-neutral">{u.status || 'ACTIVE'}</span>
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
