
"use client";
import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, BrainCircuit, CheckCircle2, ChevronRight, MessageSquareCode } from 'lucide-react';

export default function TrainAIPage() {
  const [records, setRecords] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);

  useEffect(() => {
    fetch('/api/v1/admin/learn/records').then(r => r.json()).then(setRecords);
  }, []);

  const promote = async (id: string) => {
    await fetch('/api/v1/admin/flows/promote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ learningRecordId: id })
    });
    alert('Promoted to Registry Candidate!');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-12">
      <div className="max-w-7xl mx-auto">
        <header className="mb-16">
           <h1 className="text-4xl font-black italic uppercase tracking-tighter text-white">Neural Optimizer</h1>
           <p className="text-slate-500 font-mono text-xs mt-2 uppercase tracking-[0.3em]">Learning Loop • Knowledge Promotion</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
           <aside className="lg:col-span-4 space-y-4">
              <h3 className="text-[10px] font-black uppercase text-indigo-500 tracking-widest mb-6">Completed Cycles</h3>
              {records.map(r => (
                <button 
                  key={r.id} 
                  onClick={() => setSelected(r)}
                  className={`w-full p-6 rounded-3xl border text-left transition-all ${selected?.id === r.id ? 'bg-indigo-600/10 border-indigo-500' : 'bg-slate-900 border-slate-800 hover:border-slate-700'}`}
                >
                   <div className="flex justify-between items-start mb-2">
                      <span className="text-[8px] font-mono text-slate-500 uppercase tracking-tighter">Case_{r.caseId.slice(-8)}</span>
                      <span className="text-[8px] font-black uppercase px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded">Success</span>
                   </div>
                   <h4 className="font-bold text-lg italic uppercase">{r.case.serviceId}</h4>
                   <p className="text-slate-500 text-xs mt-2">{new Date(r.createdAt).toLocaleDateString()}</p>
                </button>
              ))}
           </aside>

           <main className="lg:col-span-8">
              {selected ? (
                <div className="bg-slate-900 border border-slate-800 p-10 rounded-[3rem] animate-in fade-in zoom-in duration-500">
                   <div className="flex justify-between items-start mb-12">
                      <div>
                         <h2 className="text-2xl font-black uppercase italic tracking-tight">{selected.case.serviceId} Insights</h2>
                         <p className="text-slate-500 text-xs mt-1 font-mono uppercase">Flow Strategy: Dynamic AI</p>
                      </div>
                      <button 
                        onClick={() => promote(selected.id)}
                        className="bg-indigo-600 px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-indigo-600/20 flex items-center gap-2"
                      >
                         <BrainCircuit className="w-4 h-4" /> Promote to Flow v2
                      </button>
                   </div>

                   <div className="space-y-12">
                      <Section title="Detected Intent">
                         <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800">
                            <pre className="text-indigo-400 font-mono text-[10px] italic">{selected.intentJson}</pre>
                         </div>
                      </Section>

                      <Section title="Question Sequence Used">
                         <div className="space-y-4">
                            {JSON.parse(selected.sequenceJson || '[]').map((step: any, i: number) => (
                               <div key={i} className="flex gap-4 items-center p-4 bg-slate-950/50 rounded-2xl border border-slate-800/50">
                                  <div className="w-6 h-6 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 flex items-center justify-center font-black text-[10px]">{i+1}</div>
                                  <div className="flex-1">
                                     <p className="text-xs font-bold text-white">{step.asked}</p>
                                     <p className="text-[10px] text-slate-500 mt-1 uppercase">Answered: <span className="text-emerald-400">{step.answered}</span></p>
                                  </div>
                                  <CheckCircle2 className="w-4 h-4 text-emerald-500/30" />
                               </div>
                            ))}
                         </div>
                      </Section>

                      <Section title="Expert Intervention (Lawyer Diff)">
                         <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 border-dashed">
                            <div className="flex items-center gap-3 text-orange-500/50 mb-4">
                               <MessageSquareCode className="w-5 h-5" />
                               <span className="text-[10px] font-black uppercase tracking-widest">3 Edits Detected</span>
                            </div>
                            <pre className="text-slate-500 font-mono text-[10px] leading-relaxed">
                               {selected.lawyerEditsJson || 'No manual edits were required for this sequence.'}
                            </pre>
                         </div>
                      </Section>
                   </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-slate-900 rounded-[3rem] p-20 text-center">
                   <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center mb-6">
                      <Sparkles className="w-10 h-10 text-slate-800" />
                   </div>
                   <h3 className="text-slate-600 font-black uppercase italic text-xl">Select a cycle to optimize</h3>
                </div>
              )}
           </main>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: any) {
  return (
    <div>
       <h4 className="text-[10px] font-black uppercase text-slate-600 mb-6 tracking-widest flex items-center gap-2">
          <ChevronRight className="w-3 h-3 text-indigo-500" /> {title}
       </h4>
       {children}
    </div>
  );
}
