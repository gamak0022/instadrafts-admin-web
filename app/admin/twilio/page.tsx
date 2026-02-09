
"use client";
import React, { useState } from 'react';
import { Smartphone, ShieldCheck, Zap, Copy, ExternalLink } from 'lucide-react';

export default function TwilioConfigPage() {
  const [config, setConfig] = useState({
    accountSid: 'AC_...',
    authToken: '••••••••••••••••••••',
    messagingServiceSid: 'MG_...',
    webhookUrl: 'https://instadrafts-api.a.run.app/v1/twilio/webhook'
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-12">
      <div className="max-w-4xl mx-auto">
        <header className="mb-16">
          <h1 className="text-4xl font-black italic uppercase tracking-tighter text-white">Channel Mapping</h1>
          <p className="text-slate-500 font-mono text-xs mt-2 uppercase">WhatsApp/Twilio Engine Configuration</p>
        </header>

        <div className="space-y-8">
          <div className="bg-slate-900 border border-slate-800 p-10 rounded-[3rem]">
            <h3 className="text-xs font-black uppercase text-indigo-500 mb-8 tracking-widest flex items-center gap-2">
              <ShieldCheck className="w-4 h-4"/> API Authentication
            </h3>
            <div className="grid gap-6">
               <Field label="Account SID" value={config.accountSid} />
               <Field label="Auth Token" value={config.authToken} type="password" />
               <Field label="Messaging Service SID" value={config.messagingServiceSid} />
            </div>
            <button className="w-full mt-10 bg-indigo-600 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-indigo-500 shadow-xl shadow-indigo-600/20 transition-all">
              Update Credentials
            </button>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-10 rounded-[3rem]">
            <h3 className="text-xs font-black uppercase text-emerald-500 mb-8 tracking-widest flex items-center gap-2">
               <Zap className="w-4 h-4"/> Live Webhook Endpoint
            </h3>
            <div className="relative group">
               <input 
                readOnly 
                value={config.webhookUrl} 
                className="w-full bg-slate-950 border border-slate-800 p-5 rounded-2xl font-mono text-xs text-emerald-400 italic"
               />
               <button 
                onClick={() => navigator.clipboard.writeText(config.webhookUrl)}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-slate-800 rounded-xl hover:text-emerald-400 transition-colors"
               >
                  <Copy className="w-4 h-4" />
               </button>
            </div>
            <p className="mt-6 text-[10px] text-slate-600 uppercase font-bold flex items-center gap-2">
               <ExternalLink className="w-3 h-3"/> Configure this URL in Twilio Console Sandbox Settings
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, type = 'text' }: any) {
  return (
    <div>
      <label className="block text-[8px] font-black uppercase text-slate-600 mb-2 tracking-[0.2em]">{label}</label>
      <input 
        type={type}
        value={value} 
        readOnly
        className="w-full bg-slate-950 border border-slate-800 p-4 rounded-xl text-sm font-bold text-slate-300"
      />
    </div>
  );
}
