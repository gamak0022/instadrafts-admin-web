"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function setCookie(name: string, value: string) {
  // 30 days
  const maxAge = 60 * 60 * 24 * 30;
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
}

export default function LoginClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const nextPath = useMemo(() => sp?.get("next") || "/admin/inbox", [sp]);

  const [key, setKey] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  async function verifyAndLogin() {
    setMsg(null);
    const k = key.trim();
    if (!k) return setMsg("Enter admin key");
    setChecking(true);

    // set cookie first so proxy includes it
    setCookie("admin_key", k);

    try {
      const r = await fetch("/api/v1/admin/tasks?limit=1");
      if (!r.ok) {
        const t = await r.text();
        throw new Error(`Auth failed: ${r.status} ${t}`);
      }
      localStorage.setItem("admin_key", k);
            try { if (typeof window !== "undefined") localStorage.setItem("ADMIN_API_KEY", key); } catch {}

      router.push(nextPath);
    } catch (e: any) {
      setCookie("admin_key", "");
      localStorage.removeItem("admin_key");
      setMsg(e?.message || String(e));
    } finally {
      setChecking(false);
    }
  }

  // convenience: if already stored, prefill
  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("admin_key") : null;
    if (saved && !key) setKey(saved);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/40 p-6 shadow">
        <div className="text-2xl font-semibold">Instadrafts Admin</div>
        <div className="text-slate-400 mt-1 text-sm">Enter Admin Key to continue</div>

        <div className="mt-5 space-y-3">
          <input
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="Admin Key"
            className="w-full rounded-xl bg-slate-950 border border-slate-800 px-4 py-3 outline-none focus:border-slate-600"
          />
          <button
            disabled={checking}
            onClick={verifyAndLogin}
            className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 px-4 py-3 font-medium"
          >
            {checking ? "Checking..." : "Login"}
          </button>
          {msg && <div className="text-red-300 text-sm whitespace-pre-wrap">{msg}</div>}
        </div>
      </div>
    </div>
  );
}
