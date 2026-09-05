import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, DollarSign, Shield, Activity, TrendingUp, CreditCard, ArrowRight, AlertCircle } from 'lucide-react';
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

export const AdminOverviewPage: React.FC = () => {
  const [data, setData] = useState<AdminOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOverview = async () => {
    try {
      setLoading(true);
      const res = await apiRequest<AdminOverviewData>('/admin/overview');
      setData(res);
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
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-neutral-200 rounded-xl w-64"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-32 bg-neutral-200 rounded-3xl"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 rounded-3xl bg-red-50 text-red-700 text-center">
        <AlertCircle className="w-8 h-8 mx-auto text-red-500 mb-2" />
        <h3 className="font-bold">Error loading admin metrics</h3>
        <p className="text-xs text-red-600 mb-4">{error}</p>
        <button onClick={fetchOverview} className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold">
          Retry
        </button>
      </div>
    );
  }

  const { stats, recentUsers, recentPayments } = data;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#080512]">
            Facility Executive Summary
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Global metrics across membership revenue, facility throughput, coach ratios, and athlete retention.
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            to="/admin/users"
            className="px-4 py-2.5 rounded-xl bg-[#080512] text-white text-xs font-bold flex items-center gap-1.5 hover:bg-neutral-800"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Manage Users</span>
          </Link>
          <Link
            to="/admin/payments"
            className="px-4 py-2.5 rounded-xl bg-purple-50 text-purple-900 border border-purple-200 text-xs font-bold flex items-center gap-1.5 hover:bg-purple-100"
          >
            <DollarSign className="w-3.5 h-3.5 text-purple-700" />
            <span>View Invoices</span>
          </Link>
        </div>
      </div>

      {/* Primary KPI Blocks */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-neutral-200/80 shadow-sm">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-bold uppercase text-neutral-500">Total Users</span>
            <Users className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#080512]">{stats.totalUsers}</div>
          <div className="text-[11px] font-bold text-emerald-600 mt-1">+12% this month</div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-neutral-200/80 shadow-sm">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-bold uppercase text-neutral-500">Active Members</span>
            <CreditCard className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#080512]">{stats.activeMembers}</div>
          <div className="text-[11px] font-semibold text-neutral-500 mt-1">Paid subscriptions</div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-neutral-200/80 shadow-sm col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-bold uppercase text-neutral-500">Total Revenue</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-700">
            ${stats.totalRevenue.toLocaleString()}
          </div>
          <div className="text-[11px] font-bold text-emerald-600 mt-1">+18.4% ARR growth</div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-neutral-200/80 shadow-sm">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-bold uppercase text-neutral-500">Trainers</span>
            <Shield className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#080512]">{stats.activeTrainers}</div>
          <div className="text-[11px] font-semibold text-neutral-500 mt-1">Certified staff</div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-neutral-200/80 shadow-sm">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-bold uppercase text-neutral-500">Check-ins</span>
            <Activity className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#080512]">{stats.todayCheckins}</div>
          <div className="text-[11px] font-semibold text-neutral-500 mt-1">Turnstile scans today</div>
        </div>
      </div>

      {/* Grid: Recent Users & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Recent Registered Users */}
        <div className="lg:col-span-6 bg-white rounded-[32px] p-6 sm:p-8 border border-neutral-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-black text-[#080512]">Recent Registrations</h2>
              <p className="text-xs text-neutral-500 mt-0.5">Newly joined gym members</p>
            </div>
            <Link to="/admin/users" className="text-xs font-bold text-purple-700 hover:underline">
              View Directory →
            </Link>
          </div>

          <div className="divide-y divide-neutral-100">
            {recentUsers.map((u) => (
              <div key={u.userId} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-900 font-bold text-xs flex items-center justify-center">
                    {u.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-xs text-[#080512]">{u.name}</div>
                    <div className="text-[10px] text-neutral-400">{u.fitnessGoal}</div>
                  </div>
                </div>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600">
                  {u.status || 'ACTIVE'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Payments */}
        <div className="lg:col-span-6 bg-white rounded-[32px] p-6 sm:p-8 border border-neutral-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-black text-[#080512]">Recent Ledger Transactions</h2>
              <p className="text-xs text-neutral-500 mt-0.5">Membership dues and upgrades</p>
            </div>
            <Link to="/admin/payments" className="text-xs font-bold text-purple-700 hover:underline">
              All Invoices →
            </Link>
          </div>

          <div className="divide-y divide-neutral-100">
            {recentPayments.map((p) => (
              <div key={p.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-bold text-xs text-[#080512]">{p.planName} Tier</div>
                  <div className="text-[10px] text-neutral-400">
                    {p.date} • {p.paymentMethod}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-black text-xs text-emerald-700">+${p.amount}</div>
                  <span className="text-[9px] font-black uppercase text-emerald-600">
                    {p.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
