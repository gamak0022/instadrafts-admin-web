#!/usr/bin/env bash
set -euo pipefail

cd ~/instadrafts-admin-web

echo "== repo =="
pwd
git rev-parse --show-toplevel

STASHED=0
if [[ -n "$(git status --porcelain=v1)" ]]; then
  NAME="autostash_patch_501_$(date +%Y%m%d_%H%M%S)"
  git stash push -u -m "$NAME"
  STASHED=1
fi

git pull --rebase

# ----------------------------
# Files
# ----------------------------
mkdir -p app/admin/_lib app/admin/_components app/admin/search app/admin/train-ai app/admin/whatsapp

# Admin API helper (base + admin key)
cat > app/admin/_lib/adminApi.ts <<'TS'
"use client";

const DEFAULT_BASE = "https://instadrafts-api-xkrdwictda-el.a.run.app";

function getBase(): string {
  return (process.env.NEXT_PUBLIC_ADMIN_API_BASE || DEFAULT_BASE).replace(/\/+$/, "");
}

function getAdminKey(): string {
  if (typeof window !== "undefined") {
    const k = window.localStorage.getItem("ADMIN_API_KEY");
    if (k && k.trim()) return k.trim();
  }
  const envKey = process.env.NEXT_PUBLIC_ADMIN_API_KEY;
  return (envKey || "").trim();
}

export async function adminFetch(path: string, init?: RequestInit) {
  const url = path.startsWith("http") ? path : `${getBase()}${path.startsWith("/") ? "" : "/"}${path}`;

  const adminKey = getAdminKey();
  const headers: Record<string, string> = {
    ...(init?.headers ? (init.headers as any) : {}),
  };

  if (!headers["content-type"] && init?.body) headers["content-type"] = "application/json";
  if (adminKey) headers["x-admin-key"] = adminKey;

  const r = await fetch(url, { ...init, headers });
  const t = await r.text();

  let j: any = null;
  try { j = JSON.parse(t); } catch {}

  if (!r.ok) {
    const msg = j?.error?.message || t || `HTTP ${r.status}`;
    throw new Error(msg);
  }
  return j ?? { ok: true, text: t };
}
TS

# UI bits
cat > app/admin/_components/ui.tsx <<'TSX'
"use client";
import React from "react";

export function PageHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-100">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-slate-400">{subtitle}</p> : null}
      </div>
      {right ? <div className="flex items-center gap-2">{right}</div> : null}
    </div>
  );
}

export function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 shadow-sm">{children}</div>;
}

export function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-slate-800 px-2.5 py-0.5 text-xs font-medium text-slate-200">
      {children}
    </span>
  );
}

export function Button({
  children,
  onClick,
  variant = "primary",
  type = "button",
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "ghost" | "danger";
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  const base =
    "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-slate-600 disabled:opacity-50 disabled:cursor-not-allowed";
  const styles: Record<string, string> = {
    primary: "bg-indigo-600 hover:bg-indigo-500 text-white",
    ghost: "bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800",
    danger: "bg-rose-600 hover:bg-rose-500 text-white",
  };
  return (
    <button type={type} onClick={onClick} className={`${base} ${styles[variant]}`} disabled={disabled}>
      {children}
    </button>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={
        "w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-700 " +
        (props.className || "")
      }
    />
  );
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={
        "w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-700 " +
        (props.className || "")
      }
    />
  );
}

export function Modal({
  open,
  title,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  React.useEffect(() => {
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-950 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <div className="text-sm font-semibold text-slate-100">{title}</div>
          <button onClick={onClose} className="rounded-lg px-2 py-1 text-slate-400 hover:bg-slate-900">✕</button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}
TSX

# /admin/search
cat > app/admin/search/page.tsx <<'TSX'
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
TSX

# /admin/train-ai
cat > app/admin/train-ai/page.tsx <<'TSX'
"use client";

import { useEffect, useMemo, useState } from "react";
import { adminFetch } from "../_lib/adminApi";
import { Badge, Button, Card, Input, Modal, PageHeader, Textarea } from "../_components/ui";

type Template = any;

export default function TrainAIPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [stateCode, setStateCode] = useState("MH");
  const [language, setLanguage] = useState("MR");
  const [docType, setDocType] = useState("FREEFORM");
  const [tags, setTags] = useState("");

  const [selected, setSelected] = useState<Template | null>(null);
  const [upload, setUpload] = useState({ fileName: "", mimeType: "", storageUrl: "", extractedText: "" });
  const [questionsJson, setQuestionsJson] = useState<string>("");

  const filtered = useMemo(() => {
    if (!q.trim()) return templates;
    const qq = q.toLowerCase();
    return templates.filter((t) => (t.title || "").toLowerCase().includes(qq) || (t.description || "").toLowerCase().includes(qq));
  }, [templates, q]);

  async function refresh() {
    setErr("");
    setLoading(true);
    try {
      const data = await adminFetch(`/v1/admin/train-ai/templates?limit=200`);
      setTemplates(data.templates || []);
    } catch (e: any) {
      setErr(e?.message || "LOAD_FAILED");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refresh(); }, []);

  async function createTemplate() {
    const payload = {
      title,
      description,
      state: stateCode,
      language,
      docType,
      tags: tags.split(",").map((x) => x.trim()).filter(Boolean),
    };
    await adminFetch(`/v1/admin/train-ai/templates`, { method: "POST", body: JSON.stringify(payload) });
    setCreateOpen(false);
    setTitle(""); setDescription(""); setTags("");
    await refresh();
  }

  async function openTemplate(id: string) {
    const data = await adminFetch(`/v1/admin/train-ai/templates/${id}`);
    setSelected(data.template);
    setQuestionsJson("");
  }

  async function uploadVersion() {
    if (!selected) return;
    await adminFetch(`/v1/admin/train-ai/templates/${selected.id}/upload`, { method: "POST", body: JSON.stringify(upload) });
    await openTemplate(selected.id);
  }

  async function generateQuestions() {
    if (!selected) return;
    const latestVersion = selected.versions?.[0]?.id || null;
    const data = await adminFetch(`/v1/admin/train-ai/templates/${selected.id}/generate-questions`, {
      method: "POST",
      body: JSON.stringify({ templateVersionId: latestVersion }),
    });
    setQuestionsJson(JSON.stringify(data.questions || data, null, 2));
    await openTemplate(selected.id);
  }

  async function markDeterministic(qsId: string) {
    await adminFetch(`/v1/admin/train-ai/questionsets/${qsId}/mark-deterministic`, { method: "POST", body: JSON.stringify({}) });
    await openTemplate(selected!.id);
  }

  return (
    <div className="mx-auto max-w-6xl p-6">
      <PageHeader
        title="Train AI"
        subtitle="Create deterministic question templates per state + language + docType."
        right={
          <>
            <Button variant="ghost" onClick={refresh} disabled={loading}>{loading ? "Refreshing..." : "Refresh"}</Button>
            <Button onClick={() => setCreateOpen(true)}>+ New Template</Button>
          </>
        }
      />

      {err ? <div className="mb-4 rounded-xl border border-rose-900 bg-rose-950/30 p-3 text-sm text-rose-200">{err}</div> : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm font-semibold text-slate-100">Templates</div>
            <Badge>{filtered.length}</Badge>
          </div>
          <Input placeholder="Search title/description..." value={q} onChange={(e) => setQ(e.target.value)} />
          <div className="mt-3 space-y-2">
            {filtered.map((t) => (
              <button
                key={t.id}
                onClick={() => openTemplate(t.id)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-left hover:bg-slate-900"
              >
                <div className="text-sm font-medium text-slate-100">{t.title}</div>
                <div className="mt-0.5 text-xs text-slate-500">
                  {t.state} · {t.language} · {t.docType} · v{t.versions?.[0]?.version || 0} · qs:{t.questionSets?.length || 0}
                </div>
              </button>
            ))}
            {filtered.length === 0 ? <div className="text-sm text-slate-500">No templates yet.</div> : null}
          </div>
        </Card>

        <div className="lg:col-span-2 space-y-4">
          {!selected ? (
            <Card><div className="text-sm text-slate-400">Select a template to manage uploads and question sets.</div></Card>
          ) : (
            <>
              <Card>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-lg font-semibold text-slate-100">{selected.title}</div>
                    <div className="mt-1 text-sm text-slate-400">{selected.description || "—"}</div>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-400">
                      <Badge>{selected.state}</Badge>
                      <Badge>{selected.language}</Badge>
                      <Badge>{selected.docType}</Badge>
                    </div>
                  </div>
                  <Button variant="ghost" onClick={() => setSelected(null)}>Close</Button>
                </div>
              </Card>

              <Card>
                <div className="mb-3 flex items-center justify-between">
                  <div className="text-sm font-semibold text-slate-100">Upload reference (stub)</div>
                  <Button variant="ghost" onClick={uploadVersion}>Upload</Button>
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <Input placeholder="fileName" value={upload.fileName} onChange={(e) => setUpload({ ...upload, fileName: e.target.value })} />
                  <Input placeholder="mimeType" value={upload.mimeType} onChange={(e) => setUpload({ ...upload, mimeType: e.target.value })} />
                  <Input placeholder="storageUrl" value={upload.storageUrl} onChange={(e) => setUpload({ ...upload, storageUrl: e.target.value })} />
                  <Input placeholder="extractedText (short)" value={upload.extractedText} onChange={(e) => setUpload({ ...upload, extractedText: e.target.value })} />
                </div>
                <div className="mt-3 text-xs text-slate-500">Next: real upload + OCR/extraction + deterministic question builder.</div>
              </Card>

              <Card>
                <div className="mb-3 flex items-center justify-between">
                  <div className="text-sm font-semibold text-slate-100">Question sets</div>
                  <Button onClick={generateQuestions}>Generate Questions</Button>
                </div>

                <div className="space-y-2">
                  {(selected.questionSets || []).map((qs: any) => (
                    <div key={qs.id} className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-slate-200">
                          {qs.id.slice(0, 8)}… <span className="text-slate-500">·</span> {qs.isDeterministic ? "Deterministic" : "Draft"}
                        </div>
                        {!qs.isDeterministic ? (
                          <Button variant="ghost" onClick={() => markDeterministic(qs.id)}>Mark deterministic</Button>
                        ) : (
                          <Badge>LOCKED</Badge>
                        )}
                      </div>
                      <div className="mt-2 text-xs text-slate-500">{qs.state} · {qs.language} · {qs.docType}</div>
                    </div>
                  ))}
                  {(selected.questionSets || []).length === 0 ? <div className="text-sm text-slate-500">No question sets yet.</div> : null}
                </div>

                {questionsJson ? (
                  <pre className="mt-3 max-h-[320px] overflow-auto rounded-xl border border-slate-800 bg-black/40 p-3 text-xs text-slate-200">
                    {questionsJson}
                  </pre>
                ) : null}
              </Card>
            </>
          )}
        </div>
      </div>

      <Modal open={createOpen} title="Create Train Template" onClose={() => setCreateOpen(false)}>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="md:col-span-2">
            <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <Textarea placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <Input placeholder="State (e.g. MH)" value={stateCode} onChange={(e) => setStateCode(e.target.value)} />
          <Input placeholder="Language (e.g. MR)" value={language} onChange={(e) => setLanguage(e.target.value)} />
          <Input placeholder="DocType (e.g. FREEFORM)" value={docType} onChange={(e) => setDocType(e.target.value)} />
          <Input placeholder="Tags (comma-separated)" value={tags} onChange={(e) => setTags(e.target.value)} />

          <div className="md:col-span-2 mt-2 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={createTemplate} disabled={!title || !stateCode || !language || !docType}>Create</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
TSX

# /admin/whatsapp
cat > app/admin/whatsapp/page.tsx <<'TSX'
"use client";

import { useEffect, useState } from "react";
import { adminFetch } from "../_lib/adminApi";
import { Badge, Button, Card, Input, Modal, PageHeader, Textarea } from "../_components/ui";

export default function WhatsAppPage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [templateSid, setTemplateSid] = useState("");
  const [language, setLanguage] = useState("en");
  const [category, setCategory] = useState("");
  const [variablesSchemaJson, setVariablesSchemaJson] = useState("");

  const [toNumber, setToNumber] = useState("whatsapp:+91");
  const [templateId, setTemplateId] = useState<string>("");
  const [variablesJson, setVariablesJson] = useState("{}");
  const [lastSend, setLastSend] = useState<any>(null);

  async function refresh() {
    setErr("");
    setLoading(true);
    try {
      const data = await adminFetch(`/v1/admin/whatsapp/templates`);
      setTemplates(data.templates || []);
      if (!templateId && data.templates?.[0]?.id) setTemplateId(data.templates[0].id);
    } catch (e: any) {
      setErr(e?.message || "LOAD_FAILED");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refresh(); }, []);

  async function createTemplate() {
    const payload = { name, templateSid, language, category, variablesSchemaJson: variablesSchemaJson || null };
    await adminFetch(`/v1/admin/whatsapp/templates`, { method: "POST", body: JSON.stringify(payload) });
    setCreateOpen(false);
    setName(""); setTemplateSid(""); setCategory(""); setVariablesSchemaJson("");
    await refresh();
  }

  async function sendTest() {
    setErr("");
    try {
      const payload = { toNumber, templateId: templateId || null, variablesJson };
      const data = await adminFetch(`/v1/admin/whatsapp/send-test`, { method: "POST", body: JSON.stringify(payload) });
      setLastSend(data);
    } catch (e: any) {
      setErr(e?.message || "SEND_FAILED");
    }
  }

  return (
    <div className="mx-auto max-w-6xl p-6">
      <PageHeader
        title="WhatsApp"
        subtitle="Manage WhatsApp templates and send test messages (stub now; real Twilio send later)."
        right={
          <>
            <Button variant="ghost" onClick={refresh} disabled={loading}>{loading ? "Refreshing..." : "Refresh"}</Button>
            <Button onClick={() => setCreateOpen(true)}>+ New Template</Button>
          </>
        }
      />

      {err ? <div className="mb-4 rounded-xl border border-rose-900 bg-rose-950/30 p-3 text-sm text-rose-200">{err}</div> : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm font-semibold text-slate-100">Templates</div>
            <Badge>{templates.length}</Badge>
          </div>
          <div className="space-y-2">
            {templates.map((t) => (
              <div key={t.id} className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2">
                <div className="text-sm font-medium text-slate-100">{t.name}</div>
                <div className="mt-0.5 text-xs text-slate-500">{t.language} · {t.provider} · {t.templateSid || "—"}</div>
              </div>
            ))}
            {templates.length === 0 ? <div className="text-sm text-slate-500">No templates yet.</div> : null}
          </div>
        </Card>

        <div className="lg:col-span-2 space-y-4">
          <Card>
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm font-semibold text-slate-100">Send test (stub)</div>
              <Button onClick={sendTest} disabled={!toNumber}>Send</Button>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Input placeholder="toNumber (e.g. whatsapp:+9199...)" value={toNumber} onChange={(e) => setToNumber(e.target.value)} />
              <Input placeholder="templateId (optional)" value={templateId} onChange={(e) => setTemplateId(e.target.value)} />
              <div className="md:col-span-2">
                <Textarea rows={5} placeholder='variablesJson (string/JSON)' value={variablesJson} onChange={(e) => setVariablesJson(e.target.value)} />
              </div>
            </div>

            {lastSend ? (
              <pre className="mt-3 max-h-[260px] overflow-auto rounded-xl border border-slate-800 bg-black/40 p-3 text-xs text-slate-200">
                {JSON.stringify(lastSend, null, 2)}
              </pre>
            ) : null}
          </Card>
        </div>
      </div>

      <Modal open={createOpen} title="Create WhatsApp Template" onClose={() => setCreateOpen(false)}>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="md:col-span-2">
            <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <Input placeholder="Template SID (optional)" value={templateSid} onChange={(e) => setTemplateSid(e.target.value)} />
          <Input placeholder="Language (e.g. en)" value={language} onChange={(e) => setLanguage(e.target.value)} />
          <Input placeholder="Category (optional)" value={category} onChange={(e) => setCategory(e.target.value)} />
          <div className="md:col-span-2">
            <Textarea placeholder="variablesSchemaJson (optional)" value={variablesSchemaJson} onChange={(e) => setVariablesSchemaJson(e.target.value)} />
          </div>

          <div className="md:col-span-2 mt-2 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={createTemplate} disabled={!name}>Create</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
TSX

if [[ "$STASHED" == "1" ]]; then
  git stash pop || { echo "stash pop conflicts - resolve manually"; exit 1; }
fi

echo "== status (after) =="
git status --porcelain=v1

echo "✅ patch_501 done"
