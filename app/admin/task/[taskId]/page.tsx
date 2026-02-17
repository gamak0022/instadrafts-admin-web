"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getJson, postJson } from "@/app/_lib/api";

export default function TaskPage() {
  const params = useParams<{ taskId: string }>();
  const router = useRouter();
  const taskId = useMemo(() => String(params?.taskId || ""), [params]);

  const [task, setTask] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setErr(null);
    try {
      // if backend doesn't have task detail endpoint yet, show from list fallback
      const list = await getJson("/api/v1/admin/tasks?limit=50");
      const t = (list.tasks || []).find((x: any) => x.id === taskId);
      setTask(t || null);
    } catch (e: any) {
      setErr(e?.message || String(e));
    }
  }

  async function pullback() {
    setErr(null);
    try {
      await postJson(`/api/v1/admin/tasks/${taskId}/pullback`, {});
      alert("Pulled back");
      await load();
    } catch (e: any) {
      setErr(e?.message || String(e));
    }
  }

  useEffect(() => { if (taskId) load(); }, [taskId]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-2xl font-semibold">Task</div>
          <div className="text-slate-400 text-sm">{taskId}</div>
        </div>
        <button onClick={() => router.push("/admin/inbox")} className="rounded-xl border border-slate-800 px-4 py-2 hover:bg-slate-900">
          Back
        </button>
      </div>

      {err && <div className="mt-4 rounded-xl border border-red-800 bg-red-900/20 p-3 text-red-200 whitespace-pre-wrap">{err}</div>}

      <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
        <div className="font-semibold">Details</div>
        <pre className="mt-3 text-xs bg-slate-950 rounded-xl border border-slate-800 p-3 overflow-auto">
{task ? JSON.stringify(task, null, 2) : "Loading..."}
        </pre>

        {task?.caseId && (
          <div className="mt-4 flex gap-2 flex-wrap">
            <button onClick={() => router.push(`/admin/case/${task.caseId}`)} className="rounded-xl border border-slate-700 px-4 py-2 hover:bg-slate-900">
              Open Case
            </button>
            <button onClick={pullback} className="rounded-xl border border-slate-700 px-4 py-2 hover:bg-slate-900">
              Pullback Task
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
