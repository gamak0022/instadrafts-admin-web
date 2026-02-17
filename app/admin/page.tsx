"use client";

import Link from "next/link";

const tiles = [
  { title: "Inbox", href: "/admin/inbox", desc: "Admin review tasks, pullback, status updates." },
  { title: "Cases", href: "/admin/cases", desc: "Case detail, assign lawyer/agent, deliver, refund." },
  { title: "Payments", href: "/admin/payments", desc: "Manual ₹1 paid, refunds, payment audit." },
  { title: "Flows", href: "/admin/flows", desc: "Workflow tracking and SLA." },
  { title: "Search", href: "/admin/search", desc: "Search cases, tasks, payments, templates, WhatsApp logs." },
  { title: "Train AI", href: "/admin/train-ai", desc: "Templates, question-sets, deterministic lock." },
  { title: "WhatsApp", href: "/admin/whatsapp", desc: "Templates + send test (Twilio stub now)." },
];

export default function AdminDashboard() {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
      <div className="mb-4">
        <div className="text-lg font-semibold text-slate-100">Dashboard</div>
        <div className="mt-1 text-sm text-slate-400">
          End-to-end control panel: review → assign → deliver → refund + Train AI + WhatsApp.
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {tiles.map((t) => (
          <Link key={t.href} href={t.href} className="group">
            <div className="h-full rounded-2xl border border-slate-800 bg-slate-950/40 p-5 transition hover:bg-slate-900/40">
              <div className="text-base font-semibold text-slate-100 group-hover:text-white">{t.title}</div>
              <div className="mt-1 text-sm text-slate-400">{t.desc}</div>
              <div className="mt-4 text-sm text-indigo-400 group-hover:underline">Open →</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
