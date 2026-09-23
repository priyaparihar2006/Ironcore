import React, { useEffect, useState } from 'react';
import { DollarSign, CreditCard, ArrowDownRight, CheckCircle2, Download } from 'lucide-react';
import { apiRequest } from '../../lib/api';
import { UserPaymentRecord } from '../../types';

export const AdminPaymentsPage: React.FC = () => {
  const [payments, setPayments] = useState<UserPaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest<{ payments: UserPaymentRecord[] }>('/admin/payments')
      .then((res) => setPayments(res.payments || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const totalCollected = payments.reduce((acc, p) => acc + p.amount, 0);

  return (
    <div className="space-y-section">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text-main)]">
            Payment Ledger & Billing Invoices
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            Reconcile recurring athletic subscriptions, upgrade invoices, and payment gateway receipts.
          </p>
        </div>

        <div className="p-card rounded-lg bg-white border border-[var(--color-border-main)]/80 shadow-sm flex items-center gap-6 self-start sm:self-center">
          <div>
            <span className="text-xs font-bold uppercase text-[var(--color-text-muted)] block">Total Processed</span>
            <span className="text-xl font-bold text-emerald-700">${totalCollected.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3 animate-pulse">
          <div className="h-64 bg-neutral-200 rounded-3xl"></div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[var(--color-border-main)] shadow-sm/80 shadow-sm overflow-hidden">
          <div className="p-card border-b border-neutral-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-[var(--color-text-main)]">Recorded Transactions</h2>
            <span className="text-xs font-bold text-[var(--color-text-muted)]">{payments.length} Records</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-neutral-50/80 text-[var(--color-text-muted)] uppercase font-bold border-b border-neutral-100">
                  <th className="py-4 px-6">Transaction ID</th>
                  <th className="py-4 px-6">Tier Plan</th>
                  <th className="py-4 px-6">Date</th>
                  <th className="py-4 px-6">Amount</th>
                  <th className="py-4 px-6">Payment Method</th>
                  <th className="py-4 px-6">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-neutral-50/50">
                    <td className="py-4 px-6 font-mono text-[var(--color-text-muted)] font-bold">{p.id}</td>
                    <td className="py-4 px-6 font-bold text-[var(--color-text-main)]">{p.planName} Membership</td>
                    <td className="py-4 px-6 text-neutral-600">{p.date}</td>
                    <td className="py-4 px-6 font-bold text-emerald-700 font-mono">${p.amount.toFixed(2)}</td>
                    <td className="py-4 px-6 text-neutral-600 flex items-center gap-2">
                      <CreditCard className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
                      <span>{p.paymentMethod}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-emerald-100 text-emerald-800">
                        {p.status}
                      </span>
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
