"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LayoutDashboard, Filter, RefreshCw, ChevronRight } from 'lucide-react';

export default function AdminInbox() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchTasks = async () => {
    setLoading(true);
    const res = await fetch('/api/v1/admin/tasks');
    const data = await res.json();
    setTasks(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-12">
      <header className="flex justify-between items-end mb-16 max-w-7xl mx-auto">
        <div>
          <h1 className="text-4xl font-black italic uppercase tracking-tighter text-white">ORCHESTRATION INBOX</h1>
          <p className="text-slate-500 font-mono text-xs mt-2 tracking-[0.3em]">Operational Readiness Status: ACTIVE</p>
        </div>
        <button onClick={fetchTasks} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl hover:bg-slate-800">
          <RefreshCw className={`w-5 h-5 text-indigo-500 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </header>

      <div className="max-w-7xl mx-auto grid gap-4">
        {tasks.map(t => (
          <div 
            key={t.id} 
            onClick={() => router.push(`/admin/task/${t.id}`)}
            className="group flex items-center justify-between p-8 bg-slate-900/50 border border-slate-800 rounded-3xl hover:border-indigo-500 cursor-pointer transition-all"
          >
            <div className="flex gap-10 items-center">
              <div className="w-12 h-12 bg-indigo-600/10 border border-indigo-600/20 rounded-2xl flex items-center justify-center font-black text-indigo-500 italic">
                {t.case.serviceId.charAt(0)}
              </div>
              <div>
                <p className="text-xs font-mono text-slate-500 mb-1 uppercase">Node: {t.id.slice(-12)}</p>
                <h3 className="font-bold text-white text-lg tracking-tight uppercase italic">{t.case.serviceId.replace('_', ' ')}</h3>
              </div>
            </div>

            <div className="flex gap-12 items-center">
              <div className="text-right">
                <p className="text-[10px] font-black uppercase text-slate-600 tracking-widest mb-1">Status</p>
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${
                  t.status === 'NEW' ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-500' : 
                  t.status === 'ASSIGNED' ? 'bg-orange-500/10 border-orange-500/20 text-orange-500' :
                  'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                }`}>
                  {t.status}
                </span>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-700 group-hover:text-white group-hover:translate-x-1 transition-all" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
