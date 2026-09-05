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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#080512]">
            Payment Ledger & Billing Invoices
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Reconcile recurring athletic subscriptions, upgrade invoices, and payment gateway receipts.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-neutral-200/80 shadow-sm flex items-center gap-4 self-start sm:self-center">
          <div>
            <span className="text-[10px] font-bold uppercase text-neutral-400 block">Total Processed</span>
            <span className="text-xl font-black text-emerald-700">${totalCollected.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3 animate-pulse">
          <div className="h-64 bg-neutral-200 rounded-3xl"></div>
        </div>
      ) : (
        <div className="bg-white rounded-[32px] border border-neutral-200/80 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
            <h2 className="text-lg font-black text-[#080512]">Recorded Transactions</h2>
            <span className="text-xs font-bold text-neutral-400">{payments.length} Records</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-neutral-50/80 text-neutral-400 uppercase font-bold border-b border-neutral-100">
                  <th className="py-3.5 px-6">Transaction ID</th>
                  <th className="py-3.5 px-6">Tier Plan</th>
                  <th className="py-3.5 px-6">Date</th>
                  <th className="py-3.5 px-6">Amount</th>
                  <th className="py-3.5 px-6">Payment Method</th>
                  <th className="py-3.5 px-6">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-neutral-50/50">
                    <td className="py-4 px-6 font-mono text-neutral-500 font-bold">{p.id}</td>
                    <td className="py-4 px-6 font-black text-[#080512]">{p.planName} Membership</td>
                    <td className="py-4 px-6 text-neutral-600">{p.date}</td>
                    <td className="py-4 px-6 font-black text-emerald-700 font-mono">${p.amount.toFixed(2)}</td>
                    <td className="py-4 px-6 text-neutral-600 flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-neutral-400" />
                      <span>{p.paymentMethod}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">
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
