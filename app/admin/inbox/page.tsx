"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getJson, postJson } from "../../_lib/api";

type Task = {
  id: string;
  caseId: string;
  type: string;
  status: string;
  assignedRole: string;
  assignedToId?: string | null;
  createdAt: string;
  updatedAt: string;
};

export default function InboxPage() {
  const [items, setItems] = useState<Task[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const data = await getJson("/api/v1/admin/tasks?limit=30");
      setItems(data.tasks || []);
    } catch (e: any) {
      setErr(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function pullback(taskId: string) {
    try {
      await postJson(`/api/v1/admin/tasks/${taskId}/pullback`, {});
      await load();
    } catch (e: any) {
      alert(String(e?.message || e));
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Inbox</h1>
        <button
          onClick={load}
          className="rounded-lg bg-slate-800 px-3 py-2 text-sm hover:bg-slate-700"
        >
          Refresh
        </button>
      </div>

      {loading && <div className="mt-4 text-slate-300">Loading…</div>}
      {err && <div className="mt-4 rounded-lg bg-red-950/40 p-3 text-red-200">{err}</div>}

      <div className="mt-4 overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-sm">
          <thead className="bg-slate-900/60 text-slate-300">
            <tr>
              <th className="p-3 text-left">Task</th>
              <th className="p-3 text-left">Case</th>
              <th className="p-3 text-left">Type</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Created</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((t) => (
              <tr key={t.id} className="border-t border-slate-800">
                <td className="p-3 font-mono text-xs">{t.id}</td>
                <td className="p-3 font-mono text-xs">{t.caseId}</td>
                <td className="p-3">{t.type}</td>
                <td className="p-3">{t.status}</td>
                <td className="p-3">{new Date(t.createdAt).toLocaleString()}</td>
                <td className="p-3 flex gap-2">
                  <Link
                    className="rounded-lg bg-slate-800 px-3 py-2 hover:bg-slate-700"
                    href={`/admin/case/${t.caseId}?taskId=${t.id}`}
                  >
                    Open
                  </Link>
                  <button
                    className="rounded-lg bg-slate-900 px-3 py-2 hover:bg-slate-800"
                    onClick={() => pullback(t.id)}
                    title="Pull back task to unassign / reset"
                  >
                    Pullback
                  </button>
                </td>
              </tr>
            ))}
            {!loading && items.length === 0 && (
              <tr>
                <td className="p-3 text-slate-400" colSpan={6}>No tasks found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
