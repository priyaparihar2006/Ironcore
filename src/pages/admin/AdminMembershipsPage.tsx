import React, { useEffect, useState } from 'react';
import { CreditCard, Check, Sparkles, Plus, Edit2, X, CheckCircle2 } from 'lucide-react';
import { apiRequest } from '../../lib/api';

interface PlanConfig {
  id: string;
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  description: string;
  activeCount: number;
  features: string[];
}

export const AdminMembershipsPage: React.FC = () => {
  const [plans, setPlans] = useState<PlanConfig[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PlanConfig | null>(null);
  const [name, setName] = useState('');
  const [monthlyPrice, setMonthlyPrice] = useState('49');
  const [annualPrice, setAnnualPrice] = useState('39');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const res = await apiRequest<{ plans: PlanConfig[] }>('/admin/memberships');
      setPlans(res.plans || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingPlan) {
        await apiRequest(`/admin/memberships/${editingPlan.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            monthlyPrice: parseFloat(monthlyPrice),
            annualPrice: parseFloat(annualPrice),
            description,
          }),
        });
      }

      setShowModal(false);
      setSuccessToast('Membership tier successfully updated.');
      await fetchPlans();
      setTimeout(() => setSuccessToast(null), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
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
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text-main)]">
          Membership Tier Management
        </h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">
          Configure subscription privileges, adjust recurring price points, and monitor active subscriber distribution.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 bg-neutral-200 rounded-3xl"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((p) => (
            <div
              key={p.id}
              className="bg-white rounded-lg p-card sm:p-card border border-[var(--color-border-main)]/80 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase text-[var(--color-text-main)] bg-[var(--color-brand-bg)] px-3 py-1 rounded-full">
                    {p.name}
                  </span>
                  <button
                    onClick={() => {
                      setEditingPlan(p);
                      setName(p.name);
                      setMonthlyPrice(String(p.monthlyPrice));
                      setAnnualPrice(String(p.annualPrice));
                      setDescription(p.description);
                      setShowModal(true);
                    }}
                    className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] rounded-lg"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-baseline gap-1 my-3">
                  <span className="text-3xl font-bold text-[var(--color-text-main)]">${p.monthlyPrice}</span>
                  <span className="text-xs font-medium text-[var(--color-text-muted)]">/ mo (${p.annualPrice} billed annually)</span>
                </div>

                <p className="text-xs text-[var(--color-text-muted)] mb-6">{p.description}</p>

                <div className="space-y-2 border-t border-neutral-100 pt-4 mb-6">
                  {p.features.map((f, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-neutral-700">
                      <Check className="w-3.5 h-3.5 text-emerald-600 mt-1 flex-shrink-0" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-lg bg-[var(--color-brand-bg)] border border-neutral-100 flex items-center justify-between text-xs">
                <span className="text-[var(--color-text-muted)] font-medium">Subscribers:</span>
                <span className="font-bold text-[var(--color-text-main)]">{p.activeCount} active</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Tier Modal */}
      {showModal && editingPlan && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-card">
          <div className="bg-white rounded-lg p-card sm:p-card max-w-md w-full shadow-sm border border-[var(--color-border-main)] animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-[var(--color-text-main)]">Edit {editingPlan.name} Tier</h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-full hover:bg-neutral-100">
                <X className="w-5 h-5 text-[var(--color-text-muted)]" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[var(--color-text-main)] mb-1">Monthly Price ($)</label>
                  <input
                    type="number"
                    required
                    value={monthlyPrice}
                    onChange={(e) => setMonthlyPrice(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-[var(--color-border-main)] text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--color-text-main)] mb-1">Annual Tier Price ($)</label>
                  <input
                    type="number"
                    required
                    value={annualPrice}
                    onChange={(e) => setAnnualPrice(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-[var(--color-border-main)] text-xs font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--color-text-main)] mb-1">Tier Pitch / Summary</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-[var(--color-border-main)] text-xs font-medium"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-4 rounded-lg bg-[var(--color-primary)] text-[var(--color-text-main)] text-xs font-bold hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                {saving ? 'Updating...' : 'Save Pricing Changes'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
