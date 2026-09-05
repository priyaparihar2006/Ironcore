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
          Membership Tier Management
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          Configure subscription privileges, adjust recurring price points, and monitor active subscriber distribution.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 bg-neutral-200 rounded-3xl"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((p) => (
            <div
              key={p.id}
              className="bg-white rounded-[32px] p-6 sm:p-8 border border-neutral-200/80 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-black uppercase text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full">
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
                    className="p-1.5 text-neutral-400 hover:text-[#080512] rounded-lg"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-baseline gap-1 my-3">
                  <span className="text-3xl font-black text-[#080512]">${p.monthlyPrice}</span>
                  <span className="text-xs font-medium text-neutral-400">/ mo (${p.annualPrice} billed annually)</span>
                </div>

                <p className="text-xs text-neutral-500 mb-6">{p.description}</p>

                <div className="space-y-2 border-t border-neutral-100 pt-4 mb-6">
                  {p.features.map((f, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-neutral-700">
                      <Check className="w-3.5 h-3.5 text-emerald-600 mt-0.5 flex-shrink-0" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-100 flex items-center justify-between text-xs">
                <span className="text-neutral-500 font-medium">Subscribers:</span>
                <span className="font-black text-[#080512]">{p.activeCount} active</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Tier Modal */}
      {showModal && editingPlan && (
        <div className="fixed inset-0 bg-[#080512]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] p-6 sm:p-8 max-w-md w-full shadow-2xl border border-neutral-200 animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black text-[#080512]">Edit {editingPlan.name} Tier</h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-full hover:bg-neutral-100">
                <X className="w-5 h-5 text-neutral-500" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#080512] mb-1">Monthly Price ($)</label>
                  <input
                    type="number"
                    required
                    value={monthlyPrice}
                    onChange={(e) => setMonthlyPrice(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#080512] mb-1">Annual Tier Price ($)</label>
                  <input
                    type="number"
                    required
                    value={annualPrice}
                    onChange={(e) => setAnnualPrice(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-xs font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#080512] mb-1">Tier Pitch / Summary</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-xs font-medium"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-3.5 rounded-2xl bg-[#080512] text-white text-xs font-bold hover:bg-neutral-800 transition-colors cursor-pointer"
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
