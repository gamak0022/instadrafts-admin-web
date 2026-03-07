"use client";

export type ApiResult<T> = { ok: true } & T | { ok: false; error?: any; detail?: any };

async function parseJsonSafe(r: Response) {
  const t = await r.text();
  try { return JSON.parse(t); } catch { return { ok: false, error: "NON_JSON_RESPONSE", detail: t?.slice(0, 2000) }; }
}

export async function apiGet<T=any>(path: string): Promise<ApiResult<T>> {
  const r = await fetch(path, { cache: "no-store" });
  if (!r.ok) return (await parseJsonSafe(r)) as any;
  return (await parseJsonSafe(r)) as any;
}

export async function apiPost<T=any>(path: string, body?: any): Promise<ApiResult<T>> {
  const r = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {})
  });
  if (!r.ok) return (await parseJsonSafe(r)) as any;
  return (await parseJsonSafe(r)) as any;
}

export function prettyJson(v: any) {
  try { return JSON.stringify(v, null, 2); } catch { return String(v ?? ""); }
}

export function parseJson(text: string) {
  const t = (text ?? "").trim();
  if (!t) return {};
  return JSON.parse(t);
}
