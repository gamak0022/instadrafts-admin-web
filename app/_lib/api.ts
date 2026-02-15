export async function getJson<T = any>(url: string): Promise<T> {
  const r = await fetch(url, { cache: 'no-store' });
  const t = await r.text();
  if (!r.ok) throw new Error(`${r.status} ${t}`);
  try { return JSON.parse(t) as T; } catch { return t as unknown as T; }
}

export async function postJson<T = any>(url: string, body: any): Promise<T> {
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body ?? {}),
  });
  const t = await r.text();
  if (!r.ok) throw new Error(`${r.status} ${t}`);
  try { return JSON.parse(t) as T; } catch { return t as unknown as T; }
}
