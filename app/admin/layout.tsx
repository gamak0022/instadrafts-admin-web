import "../globals.css";
import Link from "next/link";

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link className="hover:underline" href={href}>
      {label}
    </Link>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-6xl px-6 py-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="text-xl font-semibold">
            <Link href="/admin" className="hover:underline">Instadrafts Admin</Link>
          </div>
          <nav className="flex flex-wrap gap-4 text-sm text-slate-200">
            <NavLink href="/admin" label="Dashboard" />
            <NavLink href="/admin/inbox" label="Inbox" />
            <NavLink href="/admin/cases" label="Cases" />
            <NavLink href="/admin/payments" label="Payments" />
            <NavLink href="/admin/flows" label="Flows" />
            <NavLink href="/admin/search" label="Search" />
            <NavLink href="/admin/train-ai" label="Train AI" />
            <NavLink href="/admin/whatsapp" label="WhatsApp" />
          </nav>
        </div>
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}
