import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, DollarSign, AlertCircle } from 'lucide-react';
import { PageHeader } from '../../components/dashboard/PageHeader';
import { KpiCard } from '../../components/dashboard/KpiCard';
import { Card } from '../../components/dashboard/Card';
import { LineChart } from '../../components/charts/LineChart';
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
  stats: { newRegistrationsThisMonth: number };
  charts: {
    userGrowth: { month: string; users: number; revenue: number }[];
    membershipDistribution: { name: string; count: number }[];
  };
}

export const AdminOverviewPage: React.FC = () => {
  const [data, setData] = useState<AdminOverviewData | null>(null);
  const [analytics, setAnalytics] = useState<AdminAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOverview = async () => {
    try {
      setLoading(true);
      const [res, analyticsRes] = await Promise.all([
        apiRequest<AdminOverviewData>('/admin/overview'),
        apiRequest<AdminAnalyticsData>('/admin/analytics'),
      ]);
      setData(res);
      setAnalytics(analyticsRes);
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
        <div className="dashboard-grid">
          <div className="h-72 bg-neutral-200 rounded-2xl span-8"></div>
          <div className="h-72 bg-neutral-200 rounded-2xl span-4"></div>
        </div>
        <div className="dashboard-grid">
          <div className="h-72 bg-neutral-200 rounded-2xl span-8"></div>
          <div className="h-72 bg-neutral-200 rounded-2xl span-4"></div>
        </div>
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

      <div className="kpi-grid">
        <KpiCard label="Active Members" value={stats.activeMembers.toLocaleString()} support={`${stats.totalUsers.toLocaleString()} total accounts`} />
        <KpiCard label="Total Revenue" value={`$${stats.totalRevenue.toLocaleString()}`} support="All recorded payments" />
        <KpiCard label="Active Trainers" value={stats.activeTrainers.toLocaleString()} support="Certified staff" />
        <KpiCard
          label="New This Month"
          value={analytics?.stats?.newRegistrationsThisMonth ?? '—'}
          support="New member registrations"
        />
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
        <Card className="span-8" title="Recent Members" subtitle="Newly registered accounts" link={{ to: '/admin/users', label: 'View directory' }}>
          {recentUsers.length === 0 ? (
            <p className="py-8 text-center card-subtitle">No members have registered yet.</p>
          ) : (
            <div className="overflow-x-auto -mx-1">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-xs uppercase tracking-wider text-[var(--color-text-muted)] border-b border-[var(--color-border-main)]">
                    <th className="py-2 px-1 font-semibold">Member</th>
                    <th className="py-2 px-1 font-semibold">Goal</th>
                    <th className="py-2 px-1 font-semibold text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border-main)]">
                  {recentUsers.map((u) => (
                    <tr key={u.userId}>
                      <td className="py-3 px-1">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-[var(--color-primary)]/20 text-[var(--color-text-main)] font-semibold text-xs flex items-center justify-center shrink-0">
                            {u.name.charAt(0)}
                          </div>
                          <span className="font-medium text-[var(--color-text-main)] truncate">{u.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-1 text-[var(--color-text-muted)]">{u.fitnessGoal}</td>
                      <td className="py-3 px-1 text-right">
                        <span className="text-xs font-semibold uppercase px-2 py-1 rounded-full bg-neutral-100 text-neutral-600">
                          {u.status || 'ACTIVE'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card className="span-4" title="Recent Payments" subtitle="Membership dues and upgrades" link={{ to: '/admin/payments', label: 'All invoices' }}>
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
    </div>
  );
};
