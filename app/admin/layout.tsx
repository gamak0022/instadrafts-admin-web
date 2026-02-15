import "../globals.css";
import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-6xl px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="text-xl font-semibold">Instadrafts Admin</div>
          <nav className="flex gap-4 text-sm">
            <Link className="hover:underline" href="/admin/inbox">Inbox</Link>
            <Link className="hover:underline" href="/admin/cases">Cases</Link>
            <Link className="hover:underline" href="/admin/payments">Payments</Link>
          </nav>
        </div>
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}
