import { PageHeader } from '../../components/dashboard/PageHeader';
import { Badge } from '../../components/dashboard/Badge';
import { EmptyState } from '../../components/dashboard/EmptyState';
import React, { useEffect, useState } from 'react';
import { CreditCard, Receipt } from 'lucide-react';
import { apiRequest } from '../../lib/api';
import { UserPaymentRecord } from '../../types';

function statusTone(status: string): 'success' | 'warning' | 'danger' | 'neutral' {
  if (status === 'PAID') return 'success';
  if (status === 'PENDING') return 'warning';
  if (status === 'FAILED') return 'danger';
  return 'neutral';
}

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
      <PageHeader
        title="Payments"
        subtitle="Reconcile subscriptions, upgrade invoices and payment receipts."
        actions={
          <>
            <div className="card flex items-center gap-6 self-start sm:self-center">
              <div>
                <span className="text-xs font-bold uppercase text-[var(--color-text-muted)] block">Total Processed</span>
                <span className="text-xl font-bold text-emerald-700">${totalCollected.toLocaleString()}</span>
              </div>
            </div>
          </>
        }
      />

      {loading ? (
        <div className="space-y-3 animate-pulse">
          <div className="h-64 bg-neutral-200 rounded-3xl"></div>
        </div>
      ) : payments.length === 0 ? (
        <div className="card">
          <EmptyState icon={Receipt} title="No transactions yet" body="Payments will appear here once members start subscribing or upgrading." />
        </div>
      ) : (
        <div className="card overflow-hidden !p-0">
          <div className="p-card border-b border-neutral-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-[var(--color-text-main)]">Recorded Transactions</h2>
            <span className="text-xs font-bold text-[var(--color-text-muted)]">{payments.length} Records</span>
          </div>

          <div className="overflow-x-auto">
            <table className="table-clean">
              <thead>
                <tr>
                  <th>Transaction ID</th>
                  <th>Tier Plan</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Payment Method</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-neutral-50/50">
                    <td className="font-mono text-[var(--color-text-muted)] font-bold">{p.id}</td>
                    <td className="font-bold text-[var(--color-text-main)]">{p.planName} Membership</td>
                    <td className="text-neutral-600">{p.date}</td>
                    <td className="font-bold text-emerald-700 font-mono">${p.amount.toFixed(2)}</td>
                    <td className="text-neutral-600">
                      <span className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-[var(--color-text-muted)]" />
                        {p.paymentMethod}
                      </span>
                    </td>
                    <td>
                      <Badge tone={statusTone(p.status)}>{p.status}</Badge>
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
