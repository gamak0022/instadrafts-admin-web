"use client";

import { useEffect, useState } from "react";
import { getJson } from "../../_lib/api";

type Payment = {
  id: string;
  caseId: string;
  amount: number;
  currency: string;
  status: string;
  metaJson?: string | null;
  createdAt: string;
  updatedAt: string;
};

export default function PaymentsPage() {
  const [items, setItems] = useState<Payment[]>([]);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setErr(null);
    try {
      const data = await getJson<any>("/api/v1/payments/all");
      setItems(data.payments || []);
    } catch (e: any) {
      setErr(String(e?.message || e));
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Payments</h1>
        <button
          onClick={load}
          className="rounded-lg bg-slate-800 px-3 py-2 text-sm hover:bg-slate-700"
        >
          Refresh
        </button>
      </div>

      {err && <div className="mt-4 rounded-lg bg-red-950/40 p-3 text-red-200">{err}</div>}

      <div className="mt-4 overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-sm">
          <thead className="bg-slate-900/60 text-slate-300">
            <tr>
              <th className="p-3 text-left">Case</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Amount</th>
              <th className="p-3 text-left">Updated</th>
            </tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <tr key={p.id} className="border-t border-slate-800">
                <td className="p-3 font-mono text-xs">{p.caseId}</td>
                <td className="p-3">{p.status}</td>
                <td className="p-3">{p.amount} {p.currency}</td>
                <td className="p-3">{new Date(p.updatedAt).toLocaleString()}</td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td className="p-3 text-slate-400" colSpan={4}>No payments found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
