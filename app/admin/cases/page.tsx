"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getJson } from "../../_lib/api";

type CaseRow = {
  caseId: string;
  createdAt: string;
  updatedAt: string;
  state: string;
  language: string;
  channel: string;
  docType: string;
  status: string;
  deliveryStatus: string;
  paymentStatus: string;
  amount: number | null;
  currency: string | null;
  paymentUpdatedAt: string | null;
};

export default function CasesPage() {
  const [items, setItems] = useState<CaseRow[]>([]);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setErr(null);
    try {
      const data = await getJson<any>("/api/v1/admin/cases?limit=30");
      setItems(data.items || []);
    } catch (e: any) {
      setErr(String(e?.message || e));
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Cases</h1>
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
              <th className="p-3 text-left">State/Lang</th>
              <th className="p-3 text-left">DocType</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Payment</th>
              <th className="p-3 text-left">Created</th>
            </tr>
          </thead>
          <tbody>
            {items.map((c) => (
              <tr key={c.caseId} className="border-t border-slate-800">
                <td className="p-3 font-mono text-xs">
                  <Link className="hover:underline" href={`/admin/case/${c.caseId}`}>
                    {c.caseId}
                  </Link>
                </td>
                <td className="p-3">{c.state}/{c.language}</td>
                <td className="p-3">{c.docType}</td>
                <td className="p-3">{c.status} / {c.deliveryStatus}</td>
                <td className="p-3">
                  {c.paymentStatus}
                  {c.amount ? ` (${c.amount} ${c.currency || ""})` : ""}
                </td>
                <td className="p-3">{new Date(c.createdAt).toLocaleString()}</td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td className="p-3 text-slate-400" colSpan={6}>No cases found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
