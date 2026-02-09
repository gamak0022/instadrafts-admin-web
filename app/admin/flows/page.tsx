
"use client";
import React, { useState, useEffect } from 'react';
import { Plus, Save, Trash2, Edit3, Code } from 'lucide-react';

export default function FlowRegistryPage() {
  const [flows, setFlows] = useState<any[]>([]);
  const [editing, setEditing] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchFlows();
  }, []);

  const fetchFlows = async () => {
    const res = await fetch('/api/v1/admin/flows');
    setFlows(await res.json());
  };

  const handleSave = async () => {
    setLoading(true);
    await fetch('/api/v1/admin/flows', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editing)
    });
    setEditing(null);
    fetchFlows();
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-12">
      <header className="flex justify-between items-end mb-16">
        <div>
          <h1 className="text-4xl font-black italic uppercase tracking-tighter text-white">Logic Architect</h1>
          <p className="text-slate-500 font-mono text-xs mt-2 uppercase">Train My AI • Template Configuration</p>
        </div>
        <button 
          onClick={() => setEditing({ serviceId: 'CREATE_DOCUMENT', state: 'MH', language: 'en', docType: 'STD', version: 1, questionSet: '[]', templateText: '' })}
          className="flex items-center gap-2 bg-indigo-600 px-8 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-indigo-600/20"
        >
          <Plus className="w-4 h-4" /> Create New Node
        </button>
      </header>

      {editing ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 animate-in fade-in duration-500">
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800">
              <h3 className="text-xs font-black uppercase text-indigo-500 mb-6 tracking-widest">Metadata</h3>
              <div className="space-y-4">
                <Input label="Service ID" value={editing.serviceId} onChange={(v: string) => setEditing({...editing, serviceId: v})} />
                <Input label="State" value={editing.state} onChange={(v: string) => setEditing({...editing, state: v})} />
                <Input label="Language" value={editing.language} onChange={(v: string) => setEditing({...editing, language: v})} />
              </div>
            </div>
          </div>
          <div className="lg:col-span-8 space-y-8">
            <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800">
              <h3 className="text-xs font-black uppercase text-indigo-500 mb-6 tracking-widest flex items-center gap-2"><Edit3 className="w-3 h-3"/> Questionnaire JSON</h3>
              <textarea 
                value={editing.questionSet} 
                onChange={e => setEditing({...editing, questionSet: e.target.value})}
                className="w-full h-40 bg-slate-950 border border-slate-800 p-6 rounded-2xl font-mono text-xs text-indigo-300 italic"
              />
            </div>
            <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800">
              <h3 className="text-xs font-black uppercase text-indigo-500 mb-6 tracking-widest flex items-center gap-2"><Code className="w-3 h-3"/> Legal Template</h3>
              <textarea 
                value={editing.templateText} 
                onChange={e => setEditing({...editing, templateText: e.target.value})}
                className="w-full h-80 bg-slate-950 border border-slate-800 p-6 rounded-2xl font-serif text-lg leading-relaxed"
                placeholder="The party {{party_a}} agrees to {{obligation}}..."
              />
              <div className="flex gap-4 mt-8">
                <button onClick={handleSave} disabled={loading} className="flex-1 bg-indigo-600 py-4 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2">
                  <Save className="w-4 h-4" /> Deploy Configuration
                </button>
                <button onClick={() => setEditing(null)} className="px-8 bg-slate-800 rounded-2xl font-bold uppercase text-[10px]">Discard</button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {flows.map(f => (
            <div key={f.id} className="p-8 bg-slate-900 border border-slate-800 rounded-3xl hover:border-indigo-500 transition-all group">
              <div className="flex justify-between items-start mb-6">
                <span className="px-3 py-1 bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 font-mono text-[10px] uppercase rounded-full tracking-widest">{f.serviceId}</span>
                <span className="text-[10px] font-black text-slate-700">v{f.version}</span>
              </div>
              <h3 className="text-xl font-bold uppercase italic mb-2">{f.state} / {f.language}</h3>
              <div className="h-px bg-slate-800 my-6" />
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">{f.status}</span>
                <button onClick={() => setEditing(f)} className="text-slate-600 hover:text-white transition-colors"><Edit3 className="w-5 h-5"/></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Input({ label, value, onChange }: any) {
  return (
    <div>
      <label className="block text-[8px] font-black uppercase text-slate-600 mb-1 tracking-widest">{label}</label>
      <input 
        value={value} 
        onChange={e => onChange(e.target.value)} 
        className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-sm font-bold"
      />
    </div>
  );
}
