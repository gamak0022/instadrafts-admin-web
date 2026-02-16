'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { parsePeople, Person } from '../../_lib/people';

type AnswerRow = { key: string; value: string; updatedAt?: string };
type PaymentStatusResp =
  | { ok: true; caseId: string; status: string; amount: number | null; currency: string | null; providerOrderId?: string | null; providerPaymentId?: string | null; payment?: any }
  | any;

async function readJson(res: Response) {
  const txt = await res.text();
  try { return JSON.parse(txt); } catch { return { raw: txt }; }
}

async function getJson(path: string) {
  const res = await fetch(path, { cache: 'no-store' });
  const data = await readJson(res);
  if (!res.ok) throw new Error(data?.error?.message || data?.message || `HTTP_${res.status}`);
  return data;
}

async function postJson(path: string, body?: any) {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body || {}),
  });
  const data = await readJson(res);
  if (!res.ok) throw new Error(data?.error?.message || data?.message || `HTTP_${res.status}`);
  return data;
}

export default function AdminCasePage({ params }: any) {
  const caseId: string = String(params?.caseId || '').trim();

  const [taskId, setTaskId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [answers, setAnswers] = useState<AnswerRow[]>([]);
  const [payment, setPayment] = useState<PaymentStatusResp | null>(null);

  const [preview, setPreview] = useState<string>('');

  const LAWYERS: Person[] = useMemo(
    () => parsePeople(process.env.NEXT_PUBLIC_LAWYERS_JSON, 'lawyer'),
    []
  );
  const AGENTS: Person[] = useMemo(
    () => parsePeople(process.env.NEXT_PUBLIC_AGENTS_JSON, 'agent'),
    []
  );

  const [lawyerId, setLawyerId] = useState<string>(LAWYERS[0]?.id || '');
  const [agentId, setAgentId] = useState<string>(AGENTS[0]?.id || '');

  const [refundAmount, setRefundAmount] = useState<string>('100'); // ₹1 = 100 paise default
  const [refundRef, setRefundRef] = useState<string>('manual_refund_test');
  const [refundMode, setRefundMode] = useState<'MANUAL' | 'RAZORPAY'>('MANUAL');

  function loadTaskIdFromUrl() {
    try {
      const sp = new URLSearchParams(window.location.search);
      setTaskId(sp.get('taskId'));
    } catch {}
  }

  async function refreshAll() {
    if (!caseId) return;
    setLoading(true);
    setErr(null);
    try {
      const a = await getJson(`/api/v1/step2/answers?caseId=${encodeURIComponent(caseId)}`);
      setAnswers((a?.answers || []) as AnswerRow[]);

      const p = await getJson(`/api/v1/payments/status?caseId=${encodeURIComponent(caseId)}`);
      setPayment(p);
    } catch (e: any) {
      setErr(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTaskIdFromUrl();
    refreshAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId]);

  async function generatePreview() {
    setLoading(true);
    setErr(null);
    try {
      const r: any = await postJson(`/api/v1/step3/artifact`, { caseId });
      setPreview(r?.legalDraft || JSON.stringify(r, null, 2));
      await refreshAll();
    } catch (e: any) {
      setErr(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }

  async function markPaidRs1() {
    setLoading(true);
    setErr(null);
    try {
      await postJson(`/api/v1/admin/cases/${encodeURIComponent(caseId)}/mark-paid`, {
        amount: 100,
        currency: 'INR',
        paymentRef: 'manual_rs1_test',
      });
      await refreshAll();
      alert('Marked PAID ₹1');
    } catch (e: any) {
      setErr(String(e?.message || e));
      alert(`Mark paid failed: ${e?.message || e}`);
    } finally {
      setLoading(false);
    }
  }

  async function pullbackTask() {
    if (!taskId) return alert('taskId missing in URL (?taskId=...)');
    setLoading(true);
    setErr(null);
    try {
      await postJson(`/api/v1/admin/tasks/${encodeURIComponent(taskId)}/pullback`, {});
      alert('Pulled back');
    } catch (e: any) {
      setErr(String(e?.message || e));
      alert(`Pullback failed: ${e?.message || e}`);
    } finally {
      setLoading(false);
    }
  }

  async function assignLawyer() {
    if (!lawyerId) return alert('Select lawyer');
    setLoading(true);
    setErr(null);
    try {
      await postJson(`/api/v1/admin/cases/${encodeURIComponent(caseId)}/assign-lawyer`, { lawyerId });
      alert('Assigned lawyer');
    } catch (e: any) {
      setErr(String(e?.message || e));
      alert(`Assign lawyer failed: ${e?.message || e}`);
    } finally {
      setLoading(false);
    }
  }

  async function assignAgent() {
    if (!agentId) return alert('Select agent');
    setLoading(true);
    setErr(null);
    try {
      await postJson(`/api/v1/admin/cases/${encodeURIComponent(caseId)}/assign-agent`, { agentId });
      alert('Assigned agent');
    } catch (e: any) {
      setErr(String(e?.message || e));
      alert(`Assign agent failed: ${e?.message || e}`);
    } finally {
      setLoading(false);
    }
  }

  async function deliver() {
    setLoading(true);
    setErr(null);
    try {
      // backend deliver may not require body; send preview if present
      await postJson(`/api/v1/admin/cases/${encodeURIComponent(caseId)}/deliver`, {
        finalText: preview || undefined,
      });
      alert('Delivered');
      await refreshAll();
    } catch (e: any) {
      setErr(String(e?.message || e));
      alert(`Deliver failed: ${e?.message || e}`);
    } finally {
      setLoading(false);
    }
  }

  async function refund() {
    setLoading(true);
    setErr(null);
    try {
      const amt = Number(refundAmount);
      if (!amt || amt < 1) return alert('Refund amount must be paise (>=1)');
      await postJson(`/api/v1/admin/cases/${encodeURIComponent(caseId)}/refund`, {
        amount: amt,
        currency: 'INR',
        refundRef: refundRef || 'manual_refund',
        mode: refundMode,
      });
      alert('Refund requested/done');
      await refreshAll();
    } catch (e: any) {
      setErr(String(e?.message || e));
      alert(`Refund failed: ${e?.message || e}`);
    } finally {
      setLoading(false);
    }
  }

  const payStatus = payment?.status || payment?.payment?.status || 'UNKNOWN';
  const payAmt = payment?.amount ?? payment?.payment?.amount ?? null;
  const payCur = payment?.currency ?? payment?.payment?.currency ?? null;

  return (
    <div className="min-h-screen bg-[#050B16] text-slate-100 px-6 py-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-2xl font-semibold">Case</div>
          <div className="mt-2 font-mono text-sm text-slate-300">{caseId}</div>
          {taskId && <div className="font-mono text-xs text-slate-500">task: {taskId}</div>}
        </div>

        <div className="flex gap-2 flex-wrap justify-end">
          <button className="rounded-xl bg-slate-800 px-4 py-2 hover:bg-slate-700" onClick={refreshAll} disabled={loading}>
            Refresh
          </button>
          <button className="rounded-xl bg-slate-800 px-4 py-2 hover:bg-slate-700" onClick={pullbackTask} disabled={loading}>
            Pullback Task
          </button>
          <button className="rounded-xl bg-emerald-700 px-4 py-2 hover:bg-emerald-600" onClick={markPaidRs1} disabled={loading}>
            Mark Paid ₹1
          </button>
          <button className="rounded-xl bg-indigo-600 px-4 py-2 hover:bg-indigo-500" onClick={deliver} disabled={loading}>
            Deliver
          </button>
        </div>
      </div>

      {err && (
        <div className="mt-4 rounded-xl border border-red-800 bg-red-950/40 p-3 text-sm text-red-200">
          {err}
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-4">
          <div className="text-lg font-semibold">Payment</div>
          <div className="mt-2 text-sm text-slate-300">
            Status: <span className="font-semibold">{String(payStatus)}</span>
            {payAmt != null && payCur ? ` (${payAmt} ${payCur})` : ''}
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Razorpay order works after env keys are set in API. Until then manual mark-paid is OK.
          </div>

          <div className="mt-4 border-t border-slate-800 pt-4">
            <div className="text-sm font-semibold">Refund</div>
            <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2">
              <input
                className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 font-mono text-sm"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                placeholder="amount (paise)"
              />
              <input
                className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 font-mono text-sm"
                value={refundRef}
                onChange={(e) => setRefundRef(e.target.value)}
                placeholder="refundRef"
              />
              <select
                className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm"
                value={refundMode}
                onChange={(e) => setRefundMode(e.target.value as any)}
              >
                <option value="MANUAL">MANUAL</option>
                <option value="RAZORPAY">RAZORPAY</option>
              </select>
            </div>
            <div className="mt-3 flex justify-end">
              <button className="rounded-xl bg-amber-600 px-4 py-2 hover:bg-amber-500" onClick={refund} disabled={loading}>
                Refund
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-4">
          <div className="text-lg font-semibold">Step-2 Recorded Answers</div>
          <div className="mt-3 space-y-2">
            {answers.length === 0 ? (
              <div className="text-sm text-slate-500">No answers yet.</div>
            ) : (
              answers.map((a) => (
                <div key={a.key} className="rounded-xl border border-slate-800 bg-slate-950/40 p-3">
                  <div className="text-xs text-slate-400">{a.key}</div>
                  <div className="mt-1 font-medium">{a.value}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/30 p-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="text-lg font-semibold">Assignment</div>
          <div className="text-xs text-slate-500">
            Dropdown lists come from Vercel env: <span className="font-mono">NEXT_PUBLIC_LAWYERS_JSON</span> /
            <span className="font-mono"> NEXT_PUBLIC_AGENTS_JSON</span>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3">
            <div className="text-sm font-semibold">Assign Lawyer</div>
            <div className="mt-2 flex gap-2">
              <select
                className="flex-1 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm"
                value={lawyerId}
                onChange={(e) => setLawyerId(e.target.value)}
              >
                {LAWYERS.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} ({p.id})</option>
                ))}
              </select>
              <button className="rounded-xl bg-indigo-600 px-4 py-2 hover:bg-indigo-500" onClick={assignLawyer} disabled={loading}>
                Assign
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3">
            <div className="text-sm font-semibold">Assign Agent</div>
            <div className="mt-2 flex gap-2">
              <select
                className="flex-1 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm"
                value={agentId}
                onChange={(e) => setAgentId(e.target.value)}
              >
                {AGENTS.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} ({p.id})</option>
                ))}
              </select>
              <button className="rounded-xl bg-indigo-600 px-4 py-2 hover:bg-indigo-500" onClick={assignAgent} disabled={loading}>
                Assign
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/30 p-4">
        <div className="flex items-center justify-between">
          <div className="text-lg font-semibold">Step-3 Draft Preview</div>
          <button className="rounded-xl bg-slate-800 px-4 py-2 hover:bg-slate-700" onClick={generatePreview} disabled={loading}>
            Generate Preview
          </button>
        </div>
        <pre className="mt-3 whitespace-pre-wrap rounded-xl border border-slate-800 bg-black/40 p-4 text-sm">
          {preview ? preview : 'Click “Generate Preview”'}
        </pre>
      </div>
    </div>
  );
}
