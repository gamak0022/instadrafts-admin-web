
"use client";
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { UserPlus, Send, History, CheckCircle, FileText, Lock, Unlock, MessageSquare, Download } from 'lucide-react';

export default function AdminTaskDetail() {
  const { taskId } = useParams();
  const [task, setTask] = useState<any>(null);
  const [lawyerId, setLawyerId] = useState("");
  const [agentId, setAgentId] = useState("");
  const [infoMsg, setInfoMsg] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetchTask();
  }, [taskId]);

  const fetchTask = async () => {
    const res = await fetch(`/api/v1/admin/task/${taskId}`);
    setTask(await res.json());
  };

  const assignLawyer = async () => {
    await fetch(`/api/v1/admin/cases/${task.caseId}/assign-lawyer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lawyerId })
    });
    fetchTask();
  };

  const assignAgent = async () => {
    await fetch(`/api/v1/admin/cases/${task.caseId}/assign-agent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agentId })
    });
    fetchTask();
  };

  const requestInfo = async () => {
    await fetch(`/api/v1/cases/${task.caseId}/request-info`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: infoMsg })
    });
    setInfoMsg("");
    fetchTask();
  };

  const toggleVisibility = async (attId: string, role: string, current: boolean) => {
    await fetch(`/api/v1/attachments/${attId}/visibility`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [role]: !current })
    });
    fetchTask();
  };

  if (!task) return null;

  return (
    <div className="min-h-screen bg-slate-950 p-12 text-slate-200">
      <div className="max-w-7xl mx-auto">
        <header className="mb-12 border-b border-slate-900 pb-12 flex justify-between items-end">
          <div>
            <button onClick={() => router.back()} className="text-slate-500 hover:text-white mb-6 uppercase text-[10px] font-black tracking-widest">← Back</button>
            <h1 className="text-5xl font-black italic uppercase tracking-tighter text-white">ORCHESTRATION NODE</h1>
            <p className="font-mono text-xs text-slate-500 mt-2">Node_{taskId.slice(-8)} • {task.case.serviceId}</p>
          </div>
          <div className="flex gap-4">
             <div className="px-6 py-2 bg-indigo-600/10 border border-indigo-600/30 text-indigo-400 font-black uppercase text-xs rounded-full">{task.case.status}</div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT: CONTENT & DOCS */}
          <div className="lg:col-span-8 space-y-8">
            {/* SECURE ATTACHMENTS */}
            <section className="bg-slate-900 border border-slate-800 p-8 rounded-[2rem]">
               <div className="flex justify-between items-center mb-8">
                  <h2 className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2"><FileText className="w-4 h-4"/> Secure Documents</h2>
                  <span className="text-[10px] text-slate-600 italic">Total: {task.case.attachments.length} files</span>
               </div>
               <div className="space-y-3">
                  {task.case.attachments.map((a: any) => (
                    <div key={a.id} className="flex items-center justify-between p-5 bg-slate-950 border border-slate-800 rounded-2xl group">
                       <div className="flex items-center gap-4">
                          <div className="p-3 bg-slate-900 rounded-xl"><FileText className="w-5 h-5 text-indigo-500"/></div>
                          <div>
                             <p className="text-sm font-bold text-white">{a.fileName}</p>
                             <p className="text-[10px] uppercase font-black text-slate-600">{a.uploadedByRole} • {(a.size/1024).toFixed(1)}KB</p>
                          </div>
                       </div>
                       <div className="flex items-center gap-2">
                          <VisibilityToggle label="Client" active={a.visibleToClient} onClick={() => toggleVisibility(a.id, 'visibleToClient', a.visibleToClient)} />
                          <VisibilityToggle label="Lawyer" active={a.visibleToLawyer} onClick={() => toggleVisibility(a.id, 'visibleToLawyer', a.visibleToLawyer)} />
                          <a href={`/api/v1/attachments/stream?key=${a.storageKey}`} target="_blank" className="p-3 hover:bg-slate-800 rounded-xl transition-all">
                             <Download className="w-4 h-4 text-slate-500"/>
                          </a>
                       </div>
                    </div>
                  ))}
               </div>
            </section>

            {/* MESSAGE THREAD */}
            <section className="bg-slate-900 border border-slate-800 p-8 rounded-[2rem]">
               <h2 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-8 flex items-center gap-2"><MessageSquare className="w-4 h-4"/> Internal Loop</h2>
               <div className="space-y-6 max-h-[400px] overflow-y-auto mb-8 pr-4">
                  {task.case.messages.map((m: any) => (
                    <div key={m.id} className={`flex flex-col ${m.senderRole === 'CLIENT' ? 'items-start' : 'items-end'}`}>
                       <span className="text-[8px] font-black uppercase text-slate-600 mb-1">{m.senderRole}</span>
                       <div className={`p-4 rounded-2xl text-sm max-w-[80%] ${m.senderRole === 'CLIENT' ? 'bg-slate-950 text-slate-300' : 'bg-indigo-600 text-white'}`}>
                          {m.content}
                       </div>
                    </div>
                  ))}
               </div>
               <div className="flex gap-3">
                  <input 
                    value={infoMsg} onChange={e => setInfoMsg(e.target.value)}
                    placeholder="Request more info or leave a note..." 
                    className="flex-1 bg-slate-950 border border-slate-800 p-4 rounded-2xl text-sm"
                  />
                  <button onClick={requestInfo} className="bg-indigo-600 p-4 rounded-2xl hover:bg-indigo-500 transition-all"><Send className="w-5 h-5"/></button>
               </div>
            </section>
          </div>

          {/* RIGHT: OPS PANEL */}
          <aside className="lg:col-span-4 space-y-8">
            <div className="p-8 bg-slate-900 border border-slate-800 rounded-[2rem]">
               <h3 className="text-xs font-black uppercase text-indigo-500 mb-6 tracking-widest">Resource Assignment</h3>
               <div className="space-y-6">
                  <div>
                     <label className="block text-[8px] font-black uppercase text-slate-600 mb-2">Legal Expert (Lawyer)</label>
                     <div className="flex gap-2">
                        <input value={lawyerId || task.case.assignedLawyerId || ""} onChange={e => setLawyerId(e.target.value)} placeholder="L_ID" className="flex-1 bg-slate-950 border border-slate-800 p-3 rounded-xl text-xs font-mono" />
                        <button onClick={assignLawyer} className="bg-indigo-600 px-4 rounded-xl hover:bg-indigo-500 transition-all"><UserPlus className="w-4 h-4"/></button>
                     </div>
                  </div>
                  <div>
                     <label className="block text-[8px] font-black uppercase text-slate-600 mb-2">Field Expert (Agent)</label>
                     <div className="flex gap-2">
                        <input value={agentId || task.case.assignedAgentId || ""} onChange={e => setAgentId(e.target.value)} placeholder="A_ID" className="flex-1 bg-slate-950 border border-slate-800 p-3 rounded-xl text-xs font-mono" />
                        <button onClick={assignAgent} className="bg-indigo-600 px-4 rounded-xl hover:bg-indigo-500 transition-all"><UserPlus className="w-4 h-4"/></button>
                     </div>
                  </div>
               </div>
            </div>

            <div className="p-8 bg-slate-900 border border-slate-800 rounded-[2rem]">
               <h3 className="text-xs font-black uppercase text-slate-600 mb-6 tracking-widest flex items-center gap-2"><History className="w-3 h-3"/> Global Audit</h3>
               <div className="space-y-6 max-h-[300px] overflow-y-auto pr-2">
                  {task.audits?.map((a: any) => (
                    <div key={a.id} className="flex gap-3">
                       <div className="w-px bg-slate-800 relative"><div className="absolute top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-indigo-500 rounded-full"></div></div>
                       <div>
                          <p className="text-[10px] font-black uppercase text-white">{a.action}</p>
                          <p className="text-[8px] font-mono text-slate-600 uppercase">{a.actorRole} • {new Date(a.createdAt).toLocaleTimeString()}</p>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function VisibilityToggle({ label, active, onClick }: any) {
  return (
    <button onClick={onClick} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[8px] font-black uppercase transition-all ${active ? 'bg-indigo-600/10 border-indigo-500/30 text-indigo-400' : 'bg-slate-900 border-slate-800 text-slate-600'}`}>
       {active ? <Unlock className="w-2 h-2"/> : <Lock className="w-2 h-2"/>} {label}
    </button>
  );
}
