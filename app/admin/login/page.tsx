"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const [key, setKey] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    try {
      const r = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j?.ok) throw new Error(j?.error?.message || "LOGIN_FAILED");
      router.push("/admin/inbox");
    } catch (e: any) {
      setErr(String(e?.message || e));
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 p-6">
      <form onSubmit={onSubmit} className="w-full max-w-md bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="text-2xl font-semibold">Instadrafts Admin</div>
        <div className="text-sm text-slate-400 mt-1">Enter Admin Key to continue</div>

        <label className="block mt-6 text-sm text-slate-300">Admin Key</label>
        <input
          value={key}
          onChange={(e) => setKey(e.target.value)}
          className="mt-2 w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 outline-none"
          placeholder="ADMIN_API_KEY"
        />

        {err && <div className="mt-3 text-sm text-red-300">Error: {err}</div>}

        <button className="mt-6 w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 transition font-semibold">
          Authenticate
        </button>
      </form>
    </div>
  );
}
