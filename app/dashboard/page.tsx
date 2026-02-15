export default function Dashboard() {
  const items = [
    { href: "/admin/inbox", title: "Inbox", desc: "New tasks & SLAs" },
    { href: "/admin/cases", title: "Cases", desc: "Search, review, payment status" },
    { href: "/admin/payments", title: "Payments", desc: "Paid/Unpaid, reconcile" },
    { href: "/admin/train", title: "Train AI", desc: "Promote flows, review learned intents" },
    { href: "/admin/flows", title: "Flows", desc: "Question flows library" },
    { href: "/admin/twilio", title: "Twilio", desc: "Webhook + templates" },
    { href: "/admin/login", title: "Admin Login", desc: "Simple gate (UI-level for now)" },
  ];

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Instadrafts Admin</h1>
          <span className="text-xs text-slate-400">v0 dashboard</span>
        </div>

        <p className="text-slate-300 mt-2">
          Go to Inbox → open a task → preview draft → mark paid → assign lawyer/agent → deliver.
        </p>

        <div className="grid md:grid-cols-2 gap-4 mt-8">
          {items.map((x) => (
            <a
              key={x.href}
              href={x.href}
              className="rounded-2xl border border-slate-800 bg-slate-900/40 hover:bg-slate-900/70 transition p-5"
            >
              <div className="text-lg font-medium">{x.title}</div>
              <div className="text-sm text-slate-400 mt-1">{x.desc}</div>
              <div className="text-xs text-slate-500 mt-3">{x.href}</div>
            </a>
          ))}
        </div>
      </div>
    </main>
  );
}
