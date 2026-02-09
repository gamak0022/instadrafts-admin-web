"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield } from 'lucide-react';

export default function AdminLoginPage() {
  const [key, setKey] = useState('');
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (key.trim()) {
      localStorage.setItem('ADMIN_KEY', key);
      router.push('/admin/inbox');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-indigo-600/10 rounded-2xl flex items-center justify-center mb-4 border border-indigo-500/20">
            <Shield className="w-8 h-8 text-indigo-500" />
          </div>
          <h1 className="text-2xl font-black text-white italic tracking-tighter">ADMIN ACCESS</h1>
          <p className="text-slate-500 text-xs font-mono uppercase tracking-widest mt-2">Authorization Required</p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <input
              type="password"
              placeholder="Authorization Key"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-4 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-600 transition-all font-mono"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-indigo-600/20 uppercase tracking-widest text-xs"
          >
            Authenticate
          </button>
        </form>
      </div>
    </div>
  );
}