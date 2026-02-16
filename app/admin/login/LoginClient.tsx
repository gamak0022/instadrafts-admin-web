'use client';

import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';

function setCookie(name: string, value: string, days = 30) {
  const maxAge = days * 24 * 60 * 60;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; samesite=lax`;
}

function clearCookie(name: string) {
  document.cookie = `${name}=; path=/; max-age=0; samesite=lax`;
}

export default function LoginClient() {
  const sp = useSearchParams();
  const next = sp.get('next') || '/admin/inbox';
  const [key, setKey] = useState('');

  const apiBase = useMemo(
    () => process.env.NEXT_PUBLIC_API_BASE || 'https://instadrafts-api-xkrdwictda-el.a.run.app',
    []
  );

  return (
    <div className="min-h-screen bg-[#050B16] text-slate-100 flex items-center justify-center px-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
        <div className="text-xl font-semibold">Instadrafts Admin</div>
        <div className="mt-2 text-sm text-slate-400">
          Enter your <span className="font-mono">ADMIN_API_KEY</span>. It will be stored in a cookie and forwarded as
          <span className="font-mono"> x-admin-key</span>.
        </div>

        <div className="mt-4">
          <label className="text-xs text-slate-400">Admin Key</label>
          <input
            className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 font-mono text-sm outline-none focus:border-slate-600"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="paste key here"
          />
        </div>

        <div className="mt-5 flex gap-2">
          <button
            className="flex-1 rounded-xl bg-indigo-600 px-4 py-2 hover:bg-indigo-500"
            onClick={() => {
              if (!key.trim()) return alert('Enter admin key');
              setCookie('instadrafts_admin_key', key.trim(), 30);
              window.location.href = next;
            }}
          >
            Login
          </button>

          <button
            className="rounded-xl bg-slate-800 px-4 py-2 hover:bg-slate-700"
            onClick={() => {
              clearCookie('instadrafts_admin_key');
              alert('Cleared');
            }}
          >
            Clear
          </button>
        </div>

        <div className="mt-4 text-xs text-slate-500">
          API Base: <span className="font-mono">{apiBase}</span>
        </div>
      </div>
    </div>
  );
}
