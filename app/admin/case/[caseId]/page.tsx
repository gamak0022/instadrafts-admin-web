"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { getJson, postJson } from "../../../_lib/api";

type AnswerRow = { key: string; value: string; updatedAt: string };
type PaymentStatus = { ok: boolean; caseId: string; status: string; amount: number | null; currency: string | null };

export default function AdminCasePage() {
  const params = useParams<{ caseId: string }>();
  const sp = useSearchParams();

  const caseId = params.caseId;
  const taskId = useMemo(() => sp.get("taskId") || "", [sp]);

  const [answers, setAnswers] = useState<AnswerRow[]>([]);
  const [preview, setPreview] = useState<string>("");
  const [pay, setPay] = useState<PaymentStatus | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function loadAll() {
    setErr(null);
    try {
      const a = await getJson<any>(`/api/v1/step2/answers?caseId=${encodeURIComponent(caseId)}`);
      setAnswers(a.answers || []);
    } catch (e: any) {
      setErr(String(e?.message || e));
    }

    try {
      const p = await getJson<PaymentStatus>(`/api/v1/payments/status?caseId=${encodeURIComponent(caseId)}`);
      setPay(p);
    } catch (e: any) {
      // non-fatal
    }
  }

  useEffect(() => { loadAll(); }, [caseId]);

  async function generatePreview() {
    setErr(null);
    try {
      const r = await postJson<any>(`/api/v1/step3/artifact`, { caseId });
      setPreview(r.legalDraft || JSON.stringify(r, null, 2));
    } catch (e: any) {
      setErr(String(e?.message || e));
    }
  }

  async function markPaidRs1() {
    setErr(null);
    try {
      await postJson(`/api/v1/admin/cases/${caseId}/mark-paid`, {
        amount: 100,
        currency: "INR",
        paymentRef: `manual_rs1_${Date.now()}`,
      });
      await loadAll();
    } catch (e: any) {
      setErr(String(e?.message || e));
    }
  }

  async function deliver() {
    setErr(null);
    try {
      await postJson(`/api/v1/admin/cases/${caseId}/deliver`, {});
      alert("Delivered ✅");
    } catch (e: any) {
      setErr(String(e?.message || e));
    }
  }

  async function pullback() {
    if (!taskId) return;
    setErr(null);
    try {
      await postJson(`/api/v1/admin/tasks/${taskId}/pullback`, {});
      alert("Task pulled back ✅");
    } catch (e: any) {
      setErr(String(e?.message || e));
    }
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold">Case</h1>
          <div className="mt-1 font-mono text-xs text-slate-300">{caseId}</div>
          {taskId && <div className="mt-1 font-mono text-xs text-slate-500">task: {taskId}</div>}
        </div>

        <div className="flex flex-wrap gap-2">
          <button onClick={loadAll} className="rounded-lg bg-slate-800 px-3 py-2 text-sm hover:bg-slate-700">
            Refresh
          </button>
          {taskId && (
            <button onClick={pullback} className="rounded-lg bg-slate-900 px-3 py-2 text-sm hover:bg-slate-800">
              Pullback Task
            </button>
          )}
          <button onClick={markPaidRs1} className="rounded-lg bg-emerald-700 px-3 py-2 text-sm hover:bg-emerald-600">
            Mark Paid ₹1
          </button>
          <button onClick={deliver} className="rounded-lg bg-indigo-700 px-3 py-2 text-sm hover:bg-indigo-600">
            Deliver
          </button>
        </div>
      </div>

      {err && <div className="mt-4 rounded-lg bg-red-950/40 p-3 text-red-200">{err}</div>}

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-slate-800 p-4">
          <div className="text-sm font-semibold">Payment</div>
          <div className="mt-2 text-sm text-slate-300">
            Status: <span className="font-semibold">{pay?.status || "—"}</span>
            {pay?.amount ? ` (${pay.amount} ${pay.currency || ""})` : ""}
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Razorpay order will work after env keys are set in API. Until then manual mark-paid is OK.
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 p-4">
          <div className="text-sm font-semibold">Step-2 Recorded Answers</div>
          <div className="mt-3 space-y-2">
            {answers.map((a) => (
              <div key={a.key} className="rounded-lg bg-slate-900/60 p-3">
                <div className="text-xs text-slate-400">{a.key}</div>
                <div className="mt-1 text-sm">{a.value}</div>
              </div>
            ))}
            {answers.length === 0 && <div className="text-sm text-slate-400">No answers yet.</div>}
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 p-4 md:col-span-2">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">Step-3 Draft Preview</div>
            <button onClick={generatePreview} className="rounded-lg bg-slate-800 px-3 py-2 text-sm hover:bg-slate-700">
              Generate Preview
            </button>
          </div>

          <pre className="mt-3 max-h-[520px] overflow-auto whitespace-pre-wrap rounded-lg bg-black/40 p-4 text-xs leading-5">
            {preview || "Click “Generate Preview”"}
          </pre>
        </div>
      </div>
    </div>
  );
}
