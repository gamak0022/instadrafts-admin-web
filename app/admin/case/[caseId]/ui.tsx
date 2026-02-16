"use client";

import { useEffect, useMemo, useState } from "react";
import { LAWYERS, AGENTS } from "../../_lib/assignees";

type AnswerRow = { key: string; value: string; updatedAt?: string };
type PaymentStatus = { ok: boolean; caseId: string; status: string; amount: number | null; currency: string | null };

async function getJson(url: string) {
  const r = await fetch(url);
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j?.error?.message || `HTTP_${r.status}`);
  return j;
}
async function postJson(url: string, body: any) {
  const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body ?? {}) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j?.error?.message || `HTTP_${r.status}`);
  return j;
}

export default function CaseClient({ caseId, taskId }: { caseId: string; taskId: string | null }) {
  const [answers, setAnswers] = useState<AnswerRow[]>([]);
  const [payment, setPayment] = useState<PaymentStatus | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const [lawyerId, setLawyerId] = useState(LAWYERS?.[0]?.id || "lawyer_1");
  const [agentId, setAgentId] = useState(AGENTS?.[0]?.id || "agent_1");

  const [refundMode, setRefundMode] = useState<"MANUAL" | "RAZORPAY">("MANUAL");
  const [refundAmount, setRefundAmount] = useState<number>(100);
  const [refundReason, setRefundReason] = useState<string>("");

  async function refresh() {
    setErr(null);
    try {
      const a = await getJson(`/api/v1/step2/answers?caseId=${caseId}`);
      setAnswers(a.answers || []);
    } catch (e: any) {
      setErr(`Answers: ${String(e?.message || e)}`);
    }
    try {
      const p = await getJson(`/api/v1/payments/status?caseId=${caseId}`);
      setPayment(p);
    } catch (e: any) {
      setErr(prev => [prev, `Payment: ${String(e?.message || e)}`].filter(Boolean).join(" | "));
    }
  }

  useEffect(() => { refresh(); }, [caseId]);

  async function generatePreview() {
    setBusy("preview"); setErr(null);
    try {
      const r = await postJson(`/api/v1/step3/artifact`, { caseId });
      setPreview(r.legalDraft || JSON.stringify(r, null, 2));
      await refresh();
    } catch (e: any) {
      setErr(String(e?.message || e));
    } finally {
      setBusy(null);
    }
  }

  async function markPaidRs1() {
    setBusy("paid"); setErr(null);
    try {
      await postJson(`/api/v1/admin/cases/${caseId}/mark-paid`, { amount: 100, currency: "INR", paymentRef: `manual_rs1_${Date.now()}` });
      await refresh();
      alert("Marked PAID ₹1");
    } catch (e: any) {
      setErr(String(e?.message || e));
    } finally {
      setBusy(null);
    }
  }

  async function doRefund() {
    setBusy("refund"); setErr(null);
    try {
      await postJson(`/api/v1/admin/cases/${caseId}/refund`, {
        mode: refundMode,
        amount: refundAmount,
        reason: refundReason || undefined,
        refundRef: refundMode === "MANUAL" ? `admin_manual_${Date.now()}` : undefined,
      });
      await refresh();
      alert("Refunded");
    } catch (e: any) {
      setErr(String(e?.message || e));
    } finally {
      setBusy(null);
    }
  }

  async function assignLawyer() {
    setBusy("assign-lawyer"); setErr(null);
    try {
      await postJson(`/api/v1/admin/cases/${caseId}/assign-lawyer`, { lawyerId });
      alert("Assigned lawyer");
    } catch (e: any) {
      setErr(String(e?.message || e));
    } finally {
      setBusy(null);
    }
  }

  async function assignAgent() {
    setBusy("assign-agent"); setErr(null);
    try {
      await postJson(`/api/v1/admin/cases/${caseId}/assign-agent`, { agentId });
      alert("Assigned agent");
    } catch (e: any) {
      setErr(String(e?.message || e));
    } finally {
      setBusy(null);
    }
  }

  async function pullback() {
    if (!taskId) return alert("Missing taskId in URL");
    setBusy("pullback"); setErr(null);
    try {
      await postJson(`/api/v1/admin/tasks/${taskId}/pullback`, {});
      alert("Pulled back");
    } catch (e: any) {
      setErr(String(e?.message || e));
    } finally {
      setBusy(null);
    }
  }

  async function deliver() {
    setBusy("deliver"); setErr(null);
    try {
      await postJson(`/api/v1/admin/cases/${caseId}/deliver`, {});
      alert("Delivered");
    } catch (e: any) {
      setErr(String(e?.message || e));
    } finally {
      setBusy(null);
    }
  }

  const paid = (payment?.status || "").toUpperCase() === "PAID";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-2xl font-semibold">Case</div>
          <div className="text-slate-400 mt-1">{caseId}{taskId ? <span className="ml-3 text-xs text-slate-500">taskId: {taskId}</span> : null}</div>
        </div>

        <div className="flex gap-2">
          <button onClick={refresh} className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700">Refresh</button>
          <button onClick={pullback} disabled={!taskId || !!busy} className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50">Pullback Task</button>
          <button onClick={markPaidRs1} disabled={!!busy} className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50">Mark Paid ₹1</button>
          <button onClick={deliver} disabled={!!busy} className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50">Deliver</button>
        </div>
      </div>

      {err && <div className="mt-4 text-sm text-red-300">Error: {err}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5">
          <div className="text-lg font-semibold">Payment</div>
          <div className="mt-2 text-slate-300">
            Status: <span className="font-semibold">{payment?.status || "…"}</span>
            {payment?.amount != null ? <span className="text-slate-400"> ({payment.amount} {payment.currency || ""})</span> : null}
          </div>

          <div className="mt-5 border-t border-slate-800 pt-4">
            <div className="text-sm text-slate-400 mb-2">Refund</div>
            <div className="flex flex-wrap gap-2 items-center">
              <select value={refundMode} onChange={(e) => setRefundMode(e.target.value as any)} className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800">
                <option value="MANUAL">MANUAL</option>
                <option value="RAZORPAY">RAZORPAY</option>
              </select>
              <input value={refundAmount} onChange={(e) => setRefundAmount(Number(e.target.value))} type="number" className="w-32 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800" />
              <input value={refundReason} onChange={(e) => setRefundReason(e.target.value)} placeholder="reason (optional)" className="flex-1 min-w-[220px] px-3 py-2 rounded-xl bg-slate-950 border border-slate-800" />
              <button onClick={doRefund} disabled={!paid || !!busy} className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50">
                Refund
              </button>
            </div>
            {!paid && <div className="mt-2 text-xs text-slate-500">Refund enabled only when payment is PAID.</div>}
          </div>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5">
          <div className="text-lg font-semibold">Step-2 Recorded Answers</div>
          <div className="mt-3 space-y-2">
            {answers.map((a) => (
              <div key={a.key} className="bg-slate-950/60 border border-slate-800 rounded-xl p-3">
                <div className="text-xs text-slate-400">{a.key}</div>
                <div className="text-sm mt-1">{a.value}</div>
              </div>
            ))}
            {!answers.length && <div className="text-sm text-slate-500">No answers yet.</div>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5">
          <div className="text-lg font-semibold">Assignment</div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <div className="text-sm text-slate-400 mb-2">Lawyer</div>
              <div className="flex gap-2">
                <select value={lawyerId} onChange={(e)=>setLawyerId(e.target.value)} className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800">
                  {LAWYERS.map(l => <option key={l.id} value={l.id}>{l.name} ({l.id})</option>)}
                </select>
                <button onClick={assignLawyer} disabled={!!busy} className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50">
                  Assign
                </button>
              </div>
            </div>

            <div>
              <div className="text-sm text-slate-400 mb-2">Agent</div>
              <div className="flex gap-2">
                <select value={agentId} onChange={(e)=>setAgentId(e.target.value)} className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800">
                  {AGENTS.map(a => <option key={a.id} value={a.id}>{a.name} ({a.id})</option>)}
                </select>
                <button onClick={assignAgent} disabled={!!busy} className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50">
                  Assign
                </button>
              </div>
            </div>
          </div>

          <div className="mt-3 text-xs text-slate-500">
            Tip: override dropdowns via env: NEXT_PUBLIC_LAWYERS_CSV="lawyer_1:Rahul,lawyer_2:Meena" and NEXT_PUBLIC_AGENTS_CSV="agent_1:Akash,agent_2:Vikas"
          </div>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div className="text-lg font-semibold">Step-3 Draft Preview</div>
            <button onClick={generatePreview} disabled={!!busy} className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50">
              Generate Preview
            </button>
          </div>

          <pre className="mt-3 whitespace-pre-wrap text-sm bg-slate-950/60 border border-slate-800 rounded-xl p-4 min-h-[160px]">
            {preview || 'Click "Generate Preview"'}
          </pre>
        </div>
      </div>
    </div>
  );
}
