export async function getJson(url: string) {
  const r = await fetch(url, { cache: "no-store" });
  const t = await r.text();
  let j: any = null;
  try { j = JSON.parse(t); } catch {}
  if (!r.ok) throw new Error(j?.error?.message || t || `HTTP ${r.status}`);
  return j;
}

export async function postJson(url: string, body?: any) {
  const r = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body || {}),
  });
  const t = await r.text();
  let j: any = null;
  try { j = JSON.parse(t); } catch {}
  if (!r.ok) throw new Error(j?.error?.message || t || `HTTP ${r.status}`);
  return j;
}
