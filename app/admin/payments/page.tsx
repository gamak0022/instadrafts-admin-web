
"use client";
import React, { useEffect, useState } from 'react';
import { CreditCard, DollarSign, ArrowDownRight, RefreshCcw } from 'lucide-react';

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/v1/payments/all').then(r => r.json()).then(data => {
      setPayments(data);
      setLoading(false);
    });
  }, []);

  const total = payments.reduce((acc, p) => p.status === 'PAID' ? acc + p.amount : acc, 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-12">
      <div className="max-w-7xl mx-auto">
        <header className="mb-16 flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-black italic uppercase tracking-tighter text-white">Financial Hub</h1>
            <p className="text-slate-500 font-mono text-xs mt-2 uppercase">Transactional Ledger • Real-time Sync</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl text-right">
             <span className="block text-[10px] font-black uppercase text-indigo-500 mb-1 tracking-widest">Total Payout Volume</span>
             <span className="text-3xl font-black text-white italic">₹{(total / 100).toLocaleString()}</span>
          </div>
        </header>

        <div className="grid gap-4">
          {payments.map(p => (
            <div key={p.id} className="bg-slate-900/50 border border-slate-800 p-8 rounded-3xl flex items-center justify-between group hover:border-indigo-500/50 transition-all">
              <div className="flex gap-8 items-center">
                 <div className="w-14 h-14 bg-indigo-600/10 border border-indigo-600/20 rounded-2xl flex items-center justify-center">
                    <CreditCard className="w-7 h-7 text-indigo-500" />
                 </div>
                 <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-[10px] font-black uppercase text-slate-500">Node_{p.caseId.slice(-8)}</span>
                      <span className={`text-[8px] font-black px-2 py-0.5 rounded border uppercase ${p.status === 'PAID' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-orange-500/10 border-orange-500/20 text-orange-500'}`}>{p.status}</span>
                    </div>
                    <h3 className="font-bold text-lg uppercase italic tracking-tight">{p.case.serviceId}</h3>
                 </div>
              </div>
              <div className="flex gap-16 items-center">
                 <div className="text-right">
                    <p className="text-[10px] font-black uppercase text-slate-600 mb-1">Revenue</p>
                    <p className="text-xl font-black text-white italic">₹{p.amount / 100}</p>
                 </div>
                 <button className="px-6 py-3 bg-slate-800 border border-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/30 transition-all flex items-center gap-2">
                    <RefreshCcw className="w-3 h-3" /> Issue Refund
                 </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
