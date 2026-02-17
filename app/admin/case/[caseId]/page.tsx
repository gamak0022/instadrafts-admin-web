"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getJson, postJson } from "@/app/_lib/api";

type DirItem = { id: string; name: string };
type Directory = { ok: boolean; lawyers: DirItem[]; agents: DirItem[] };

export default function AdminCasePage() {
  const params = useParams<{ caseId: string }>();
  const router = useRouter();
  const caseId = useMemo(() => String(params?.caseId || ""), [params]);

  const [dir, setDir] = useState<Directory | null>(null);
  const [answers, setAnswers] = useState<any>(null);
  const [preview, setPreview] = useState<string>("");
  const [pay, setPay] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function loadAll() {
    setErr(null);
    try {
      const d = await getJson("/api/v1/admin/directory");
      setDir(d);

      const a = await getJson(`/api/v1/step2/answers?caseId=${caseId}`);
      setAnswers(a);

      const p = await getJson(`/api/v1/payments/status?caseId=${caseId}`);
      setPay(p);
    } catch (e: any) {
      setErr(e?.message || String(e));
    }
  }

  async function generatePreview() {
    setBusy(true); setErr(null);
    try {
      const r = await postJson(`/api/v1/step3/artifact`, { caseId });
      setPreview(r?.legalDraft || JSON.stringify(r, null, 2));
    } catch (e: any) {
      setErr(e?.message || String(e));
    } finally {
      setBusy(false);
    }
  }

  async function markPaidRs1() {
    setBusy(true); setErr(null);
    try {
      await postJson(`/api/v1/admin/cases/${caseId}/mark-paid`, {
        amount: 100, currency: "INR", paymentRef: "manual_rs1_adminweb"
      });
      await loadAll();
      alert("Marked PAID ₹1");
    } catch (e: any) {
      setErr(e?.message || String(e));
    } finally { setBusy(false); }
  }

  async function refundRs1() {
    setBusy(true); setErr(null);
    try {
      // backend should support this endpoint already
      await postJson(`/api/v1/admin/cases/${caseId}/refund`, {
        amountPaise: 100,
        reason: "admin_refund_test"
      });
      await loadAll();
      alert("Refund initiated");
    } catch (e: any) {
      setErr(e?.message || String(e));
    } finally { setBusy(false); }
  }

  async function assignLawyer(lawyerId: string) {
    if (!lawyerId) return;
    setBusy(true); setErr(null);
    try {
      await postJson(`/api/v1/admin/cases/${caseId}/assign-lawyer`, { lawyerId });
      alert("Lawyer assigned");
    } catch (e: any) {
      setErr(e?.message || String(e));
    } finally { setBusy(false); }
  }

  async function assignAgent(agentId: string) {
    if (!agentId) return;
    setBusy(true); setErr(null);
    try {
      await postJson(`/api/v1/admin/cases/${caseId}/assign-agent`, { agentId });
      alert("Agent assigned");
    } catch (e: any) {
      setErr(e?.message || String(e));
    } finally { setBusy(false); }
  }

  async function deliver() {
    setBusy(true); setErr(null);
    try {
      await postJson(`/api/v1/admin/cases/${caseId}/deliver`, {});
      alert("Delivered (client download enabled)");
    } catch (e: any) {
      setErr(e?.message || String(e));
    } finally { setBusy(false); }
  }

  useEffect(() => { if (caseId) loadAll(); }, [caseId]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-2xl font-semibold">Case</div>
          <div className="text-slate-400 text-sm">{caseId}</div>
        </div>
        <button onClick={() => router.push("/admin/inbox")} className="rounded-xl border border-slate-800 px-4 py-2 hover:bg-slate-900">
          Back
        </button>
      </div>

      {err && <div className="mt-4 rounded-xl border border-red-800 bg-red-900/20 p-3 text-red-200 whitespace-pre-wrap">{err}</div>}

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
          <div className="font-semibold">Recorded Answers</div>
          <div className="text-xs text-slate-400 mt-1">From Step-2 CaseAnswer</div>
          <pre className="mt-3 text-xs bg-slate-950 rounded-xl border border-slate-800 p-3 overflow-auto">
{answers ? JSON.stringify(answers.answers || answers, null, 2) : "Loading..."}
          </pre>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
          <div className="font-semibold">Actions</div>

          <div className="mt-3 grid gap-3">
            <button disabled={busy} onClick={generatePreview} className="rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 px-4 py-2">
              Generate Step-3 Preview
            </button>

            <div className="rounded-xl border border-slate-800 p-3">
              <div className="text-sm font-medium">Payment</div>
              <div className="text-xs text-slate-400 mt-1">Status: {pay?.status || pay?.payment?.status || "..."}</div>
              <div className="mt-2 flex gap-2 flex-wrap">
                <button disabled={busy} onClick={markPaidRs1} className="rounded-xl border border-slate-700 px-3 py-2 hover:bg-slate-900 disabled:opacity-60">
                  Mark Paid ₹1 (manual)
                </button>
                <button disabled={busy} onClick={refundRs1} className="rounded-xl border border-slate-700 px-3 py-2 hover:bg-slate-900 disabled:opacity-60">
                  Refund ₹1
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 p-3">
              <div className="text-sm font-medium">Assign</div>
              <div className="mt-2 grid gap-2">
                <select
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2"
                  defaultValue=""
                  onChange={(e) => assignLawyer(e.target.value)}
                >
                  <option value="">Assign Lawyer…</option>
                  {(dir?.lawyers || []).map(l => <option key={l.id} value={l.id}>{l.name} ({l.id})</option>)}
                </select>

                <select
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2"
                  defaultValue=""
                  onChange={(e) => assignAgent(e.target.value)}
                >
                  <option value="">Assign Agent…</option>
                  {(dir?.agents || []).map(a => <option key={a.id} value={a.id}>{a.name} ({a.id})</option>)}
                </select>
              </div>
            </div>

            <button disabled={busy} onClick={deliver} className="rounded-xl border border-slate-700 px-4 py-2 hover:bg-slate-900 disabled:opacity-60">
              Deliver (enable client download)
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
        <div className="font-semibold">Preview</div>
        <pre className="mt-3 text-xs bg-slate-950 rounded-xl border border-slate-800 p-3 overflow-auto min-h-[220px]">
{preview || "Generate preview to view Step-3 output."}
        </pre>
      </div>
    </div>
  );
}
