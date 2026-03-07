"use client";
import { useEffect, useMemo, useState } from "react";
import { apiGet, apiPost, parseJson, prettyJson } from "../../_lib/trainAiApi";

export default function CandidateReviewPage({ params }: { params: { id: string } }) {
  const id = params.id;
  const [candidate, setCandidate] = useState<any>(null);
  const [bins, setBins] = useState<any[]>([]);
  const [stateBinId, setStateBinId] = useState<string>("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const [questionFlowText, setQuestionFlowText] = useState<string>("{}");
  const [renderSpecText, setRenderSpecText] = useState<string>("{}");
  const [matchSignalsText, setMatchSignalsText] = useState<string>("{}");
  const [formatProfileText, setFormatProfileText] = useState<string>("{}");

  const [sampleAnswers, setSampleAnswers] = useState<Record<string,string>>({});
  const [previewText, setPreviewText] = useState<string>("");

  async function load() {
    setErr(null);
    const r: any = await apiGet(`/api/v1/admin/train-ai/candidates/${id}`);
    if (!r?.ok) { setErr(r?.error?.message || r?.error || r?.detail || "Failed"); return; }
    setCandidate(r.candidate);
    setStateBinId(r.candidate?.stateBinId || "");
    setQuestionFlowText(r.candidate?.questionFlowJson || "{}");
    setRenderSpecText(r.candidate?.renderSpecJson || "{}");
    setMatchSignalsText(r.candidate?.matchSignalsJson || "{}");
    setFormatProfileText(r.candidate?.formatProfileJson || "{}");

    const rb: any = await apiGet(`/api/v1/admin/train-ai/state-bins`);
    if (rb?.ok) setBins(rb.bins || []);
  }

  useEffect(() => { load(); }, [id]);

  const fieldKeys = useMemo(() => {
    try {
      const qf = parseJson(questionFlowText) as any;
      const fields = Array.isArray(qf?.fields) ? qf.fields : [];
      return fields.map((f:any)=>String(f?.key||"")).filter(Boolean).slice(0, 8);
    } catch { return []; }
  }, [questionFlowText]);

  useEffect(() => {
    const next = { ...sampleAnswers };
    for (const k of fieldKeys) if (next[k] === undefined) next[k] = "";
    setSampleAnswers(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fieldKeys.join("|")]);

  async function renderPreview() {
    setBusy("preview"); setErr(null);
    const r: any = await apiPost(`/api/v1/admin/train-ai/candidates/${id}/render-preview`, { answers: sampleAnswers });
    if (!r?.ok) { setErr(r?.error?.message || r?.error || r?.detail || "Failed"); setBusy(null); return; }
    setPreviewText(r.previewText || "");
    setBusy(null);
  }

  async function connectBin() {
    setBusy("bin"); setErr(null);
    const r: any = await apiPost(`/api/v1/admin/train-ai/candidates/${id}/connect-state-bin`, { stateBinId });
    if (!r?.ok) { setErr(r?.error?.message || r?.error || r?.detail || "Failed"); setBusy(null); return; }
    setBusy(null); await load();
  }

  async function correctViaPrompt(prompt: string) {
    setBusy("correct"); setErr(null);
    let overrides: any = {};
    try { overrides.questionFlowJson = parseJson(questionFlowText); } catch {}
    try { overrides.renderSpecJson = parseJson(renderSpecText); } catch {}
    try { overrides.matchSignalsJson = parseJson(matchSignalsText); } catch {}
    try { overrides.formatProfileJson = parseJson(formatProfileText); } catch {}
    const r: any = await apiPost(`/api/v1/admin/train-ai/candidates/${id}/correct-via-prompt`, { prompt, overrides });
    if (!r?.ok) { setErr(r?.error?.message || r?.error || r?.detail || "Failed"); setBusy(null); return; }
    setBusy(null); await load();
  }

  async function promote() {
    setBusy("promote"); setErr(null);
    const r: any = await apiPost(`/api/v1/admin/train-ai/candidates/${id}/promote`, { actor: "admin", notes: "promoted from UI", priority: 100 });
    if (!r?.ok) { setErr(r?.error?.message || r?.error || r?.detail || "Failed"); setBusy(null); return; }
    setBusy(null); await load();
    alert("✅ Promoted to ACTIVE TemplatePack");
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <div className="text-2xl font-semibold text-slate-100">Candidate Review</div>
          <div className="text-slate-500 text-sm">{id}</div>
        </div>
        <a className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800" href="/admin/train-ai">Inbox</a>
      </div>

      {err && <div className="text-sm text-rose-300">Error: {err}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 space-y-3">
          <div className="text-slate-200 font-semibold">{candidate?.docFamilyLabel || "—"}</div>
          <div className="text-slate-500 text-sm">{candidate?.serviceLane} · {candidate?.state} · {candidate?.language}</div>

          <label className="text-xs text-slate-400">Connect State Bin</label>
          <select className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200"
            value={stateBinId} onChange={(e)=>setStateBinId(e.target.value)}>
            <option value="">— select —</option>
            {bins.map((b:any)=>(<option key={b.id} value={b.id}>{b.code} ({b.state})</option>))}
          </select>

          {(() => {
            const b = bins.find((x:any) => x.id === stateBinId);
            let langs: string[] = [];
            try {
              const raw = b?.defaultLanguages;
              const arr = typeof raw === "string" ? JSON.parse(raw) : raw;
              langs = Array.isArray(arr) ? arr.map((x:any)=>String(x)).filter(Boolean).slice(0, 8) : [];
            } catch {}
            if (!langs.length) return null;
            return (
              <div className="mt-3">
                <div className="text-xs text-slate-500 mb-2">Top languages for this state (recommendation):</div>
                <div className="flex flex-wrap gap-2">
                  {langs.map((lg)=>(
                    <span key={lg} className="px-3 py-1 rounded-xl border border-slate-800 bg-slate-900 text-slate-200">{lg}</span>
                  ))}
                </div>
              </div>
            );
          })()}

          <button disabled={!!busy} onClick={connectBin} className="w-full px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-60 text-slate-100">
            {busy==="bin" ? "Saving…" : "Save State Bin"}
          </button>

          <button disabled={!!busy} onClick={promote} className="w-full px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white">
            {busy==="promote" ? "Promoting…" : "Promote to ACTIVE Pack"}
          </button>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 space-y-3">
          <div className="text-slate-200 font-semibold">Template JSON</div>
          <label className="text-xs text-slate-400">questionFlowJson</label>
          <textarea className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 min-h-[140px]"
            value={questionFlowText} onChange={(e)=>setQuestionFlowText(e.target.value)} />
          <label className="text-xs text-slate-400">renderSpecJson</label>
          <textarea className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 min-h-[140px]"
            value={renderSpecText} onChange={(e)=>setRenderSpecText(e.target.value)} />

          <button disabled={!!busy} onClick={()=>correctViaPrompt("correct via UI")} className="w-full px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-60 text-slate-100">
            {busy==="correct" ? "Saving…" : "Save JSON (Correct via prompt later)"}
          </button>

          <details className="text-xs text-slate-500">
            <summary className="cursor-pointer">Debug</summary>
            <pre className="whitespace-pre-wrap mt-2 border border-slate-800 rounded-2xl p-3 bg-slate-950 text-slate-300">{prettyJson(candidate)}</pre>
          </details>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 space-y-3">
          <div className="text-slate-200 font-semibold">Preview</div>
          {fieldKeys.map((k: string)=>(
            <div key={k}>
              <label className="text-xs text-slate-400">{k}</label>
              <input className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200"
                value={sampleAnswers[k] || ""} onChange={(e)=>setSampleAnswers({ ...sampleAnswers, [k]: e.target.value })}/>
            </div>
          ))}
          <button disabled={!!busy} onClick={renderPreview} className="w-full px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 disabled:opacity-60 text-white">
            {busy==="preview" ? "Rendering…" : "Render Preview"}
          </button>
          <pre className="whitespace-pre-wrap text-sm text-slate-200 border border-slate-800 rounded-2xl p-3 bg-slate-950 min-h-[220px]">{previewText || "—"}</pre>
        </div>
      </div>
    </div>
  );
}
