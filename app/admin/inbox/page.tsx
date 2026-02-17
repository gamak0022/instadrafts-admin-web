"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getJson, postJson } from "@/app/_lib/api";

export default function Inbox() {
  const [items, setItems] = useState<any[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    setErr(null);
    try {
      const d = await getJson("/api/v1/admin/tasks?limit=30");
      setItems(d.tasks || []);
    } catch (e: any) {
      setErr(e?.message || String(e));
    }
  }

  async function pullback(taskId: string) {
    setBusy(true);
    try {
      await postJson(`/api/v1/admin/tasks/${taskId}/pullback`, {});
      await load();
      alert("Pulled back");
    } catch (e: any) {
      setErr(e?.message || String(e));
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="text-2xl font-semibold">Admin Inbox</div>
      <div className="text-slate-400 text-sm mt-1">Tasks requiring admin action</div>

      {err && <div className="mt-4 rounded-xl border border-red-800 bg-red-900/20 p-3 text-red-200 whitespace-pre-wrap">{err}</div>}

      <div className="mt-5 rounded-2xl border border-slate-800 overflow-hidden">
        <div className="grid grid-cols-12 bg-slate-900/60 text-xs text-slate-300 px-4 py-3">
          <div className="col-span-3">Task</div>
          <div className="col-span-4">Case</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-3 text-right">Actions</div>
        </div>

        {items.map((t) => (
          <div key={t.id} className="grid grid-cols-12 px-4 py-3 border-t border-slate-800 text-sm items-center">
            <div className="col-span-3">{t.type}</div>
            <div className="col-span-4 text-slate-300">
              <Link className="underline hover:text-white" href={`/admin/case/${t.caseId}`}>{t.caseId}</Link>
            </div>
            <div className="col-span-2 text-slate-300">{t.status}</div>
            <div className="col-span-3 flex justify-end gap-2">
              <Link className="rounded-xl border border-slate-700 px-3 py-1.5 hover:bg-slate-900" href={`/admin/task/${t.id}`}>
                Task
              </Link>
              <button
                disabled={busy}
                onClick={() => pullback(t.id)}
                className="rounded-xl border border-slate-700 px-3 py-1.5 hover:bg-slate-900 disabled:opacity-60"
              >
                Pullback
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
