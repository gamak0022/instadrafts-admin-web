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
