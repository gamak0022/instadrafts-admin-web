"use client";

import { useState } from "react";
import { adminFetch } from "../_lib/adminApi";
import { Badge, Button, Card, Input, PageHeader } from "../_components/ui";

export default function SearchPage() {
  const [q, setQ] = useState("");
  const [type, setType] = useState("ALL");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [raw, setRaw] = useState<any>(null);
  const [err, setErr] = useState<string>("");

  async function run() {
    setErr("");
    setLoading(true);
    try {
      const data = await adminFetch(`/v1/admin/search?q=${encodeURIComponent(q)}&type=${encodeURIComponent(type)}&limit=50`);
      setResults(data.results || []);
      setRaw(data);
    } catch (e: any) {
      setErr(e?.message || "SEARCH_FAILED");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl p-6">
      <PageHeader
        title="Search"
        subtitle="Search cases, tasks, payments, train templates, and WhatsApp logs."
        right={<Button onClick={run} disabled={!q.trim() || loading}>{loading ? "Searching..." : "Search"}</Button>}
      />

      <Card>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-6">
          <div className="md:col-span-4">
            <Input placeholder="caseId, taskId, paymentId, phone, status..." value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <select
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-200"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              {["ALL", "CASE", "TASK", "PAYMENT", "TEMPLATE", "WHATSAPP_LOG"].map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        {err ? <div className="mt-3 rounded-xl border border-rose-900 bg-rose-950/30 p-3 text-sm text-rose-200">{err}</div> : null}

        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-slate-400">Results</div>
          <Badge>{results.length}</Badge>
        </div>

        <div className="mt-3 overflow-auto rounded-xl border border-slate-800">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-900/60 text-slate-300">
              <tr>
                <th className="px-3 py-2 text-left">Kind</th>
                <th className="px-3 py-2 text-left">ID</th>
                <th className="px-3 py-2 text-left">Case</th>
                <th className="px-3 py-2 text-left">Status/Type</th>
                <th className="px-3 py-2 text-left">Open</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {results.map((r, idx) => {
                const it = r.item || {};
                const id = it.id || "";
                const caseId = it.caseId || (r.kind === "CASE" ? id : "");
                const status = it.status || it.type || it.deliveryStatus || "—";
                return (
                  <tr key={idx} className="bg-slate-950/40">
                    <td className="px-3 py-2 text-slate-200">{r.kind}</td>
                    <td className="px-3 py-2 font-mono text-xs text-slate-300">{id}</td>
                    <td className="px-3 py-2 font-mono text-xs text-slate-300">{caseId || "—"}</td>
                    <td className="px-3 py-2 text-slate-300">{String(status)}</td>
                    <td className="px-3 py-2">
                      {caseId ? <a className="text-indigo-400 hover:underline" href={`/admin/cases?caseId=${caseId}`}>Cases</a> : <span className="text-slate-600">—</span>}
                    </td>
                  </tr>
                );
              })}
              {results.length === 0 ? (
                <tr><td colSpan={5} className="px-3 py-6 text-center text-slate-500">No results yet.</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>

        {raw ? (
          <pre className="mt-4 max-h-[260px] overflow-auto rounded-xl border border-slate-800 bg-black/40 p-3 text-xs text-slate-200">
            {JSON.stringify(raw, null, 2)}
          </pre>
        ) : null}
      </Card>
    </div>
  );
}
