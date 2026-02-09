
export default function Dashboard() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-slate-950 text-white">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold mb-8">Admin Dashboard</h1>
        <p className="text-slate-400">Instadraft Final • Production Workspace</p>
        <div className="mt-12 p-6 border border-slate-800 rounded-xl bg-slate-900">
          <p>Status: <span className="text-emerald-500 font-bold">Connected</span></p>
          <p className="mt-2 text-xs text-slate-500">Awaiting workflow events...</p>
        </div>
      </div>
    </main>
  );
}
