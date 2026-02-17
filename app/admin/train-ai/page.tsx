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
