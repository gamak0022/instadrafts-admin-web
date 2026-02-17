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
