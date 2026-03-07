"use client";

import { useEffect, useMemo, useState } from "react";
import { apiGet, apiPost } from "../_lib/trainAiApi";

export default function TrainAiCreatePage() {
  const [serviceLane, setServiceLane] = useState("CREATE_DOCUMENT");
  const [state, setState] = useState("");       // NOT constant
  const [language, setLanguage] = useState(""); // NOT constant
  const [docFamilyLabel, setDocFamilyLabel] = useState("Affidavit for Name Change");
  const [prompt, setPrompt] = useState("Create affidavit for name change in proper format.");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);

  const [bins, setBins] = useState<any[]>([]);
  const [selectedBinId, setSelectedBinId] = useState<string>("");

  const selectedBin = useMemo(() => bins.find((b:any) => b.id === selectedBinId) || null, [bins, selectedBinId]);

  const recommendedLangs: string[] = useMemo(() => {
    try {
      const raw = selectedBin?.defaultLanguages;
      if (!raw) return [];
      const arr = typeof raw === "string" ? JSON.parse(raw) : raw;
      return Array.isArray(arr) ? arr.map((x:any)=>String(x)).filter(Boolean).slice(0, 8) : [];
    } catch { return []; }
  }, [selectedBin?.defaultLanguages]);

  async function loadBins() {
    const r: any = await apiGet("/api/v1/admin/train-ai/state-bins");
    if (r?.ok) setBins(r.bins || []);
  }

  useEffect(() => { loadBins(); }, []);

  async function create() {
    setBusy(true); setErr(null); setCreatedId(null);
    const r: any = await apiPost("/api/v1/admin/train-ai/candidates/from-prompt", {
      serviceLane,
      state: state || (selectedBin?.state ?? ""),
      language,
      docFamilyLabel,
      prompt
    });
    if (!r?.ok) { setErr(r?.error?.message || r?.error || r?.detail || "Failed"); setBusy(false); return; }
    setCreatedId(r.candidateId);
    setBusy(false);
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-100">Create Candidate via Prompt</h1>
          <p className="text-slate-400 text-sm">No restriction: any state, any language. StateBin only recommends top languages.</p>
        </div>
        <a className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800" href="/admin/train-ai">Back to Inbox</a>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 space-y-4">

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
          <label className="text-xs text-slate-400">State Bin (recommended)</label>
          <select className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200"
            value={selectedBinId}
            onChange={(e) => {
              const id = e.target.value;
              setSelectedBinId(id);
              const b = bins.find((x:any) => x.id === id);
              if (b?.state) setState(String(b.state));
            }}>
            <option value="">— none (manual state/language) —</option>
            {bins.map((b:any)=>(
              <option key={b.id} value={b.id}>{b.code} ({b.state})</option>
            ))}
          </select>

          {recommendedLangs.length > 0 && (
            <div className="mt-3">
              <div className="text-xs text-slate-500 mb-2">Recommended languages for this state:</div>
              <div className="flex flex-wrap gap-2">
                {recommendedLangs.map((lg) => (
                  <button
                    key={lg}
                    type="button"
                    onClick={() => setLanguage(lg)}
                    className={`px-3 py-1 rounded-xl border ${
                      language === lg ? "border-emerald-600 bg-emerald-900/30 text-emerald-200" : "border-slate-800 bg-slate-900 text-slate-200"
                    }`}
                  >
                    {lg}
                  </button>
                ))}
              </div>
              <div className="text-xs text-slate-500 mt-2">Still allowed: type any language code below.</div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-slate-400">Service Lane</label>
            <input className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200"
              value={serviceLane} onChange={(e) => setServiceLane(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-slate-400">State (any)</label>
            <input className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200"
              placeholder="Any state code/name (MH, MAHARASHTRA, GJ, ALL)"
              value={state} onChange={(e) => setState(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-slate-400">Language (any)</label>
            <input className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200"
              placeholder="Any language code (EN, MR, HI, GU, TE, ALL)"
              value={language} onChange={(e) => setLanguage(e.target.value)} />
          </div>
        </div>

        <div>
          <label className="text-xs text-slate-400">Doc Family Label (free text)</label>
          <input className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200"
            value={docFamilyLabel} onChange={(e) => setDocFamilyLabel(e.target.value)} />
        </div>

        <div>
          <label className="text-xs text-slate-400">Prompt</label>
          <textarea className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 min-h-[160px]"
            value={prompt} onChange={(e) => setPrompt(e.target.value)} />
        </div>

        {err && <div className="text-sm text-rose-300">Error: {err}</div>}
        {createdId && (
          <div className="text-sm text-emerald-300">
            Candidate created: <a className="text-indigo-400 hover:underline" href={`/admin/train-ai/candidate/${createdId}`}>{createdId}</a>
          </div>
        )}

        <div className="flex gap-2">
          <button disabled={busy} onClick={create} className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white">
            {busy ? "Creating…" : "Create Candidate"}
          </button>
          <a className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100" href="/admin/train-ai">Inbox</a>
        </div>
      </div>
    </div>
  );
}
