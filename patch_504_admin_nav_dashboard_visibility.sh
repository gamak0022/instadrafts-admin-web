#!/usr/bin/env bash
set -euo pipefail
cd ~/instadrafts-admin-web

STASHED=0
if [[ -n "$(git status --porcelain=v1)" ]]; then
  NAME="autostash_patch_504_$(date +%Y%m%d_%H%M%S)"
  git stash push -u -m "$NAME"
  STASHED=1
fi

git pull --rebase

# 1) Add /admin dashboard page if missing
if [[ ! -f app/admin/page.tsx ]]; then
  cat > app/admin/page.tsx <<'TSX'
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
TSX
  echo "Added app/admin/page.tsx"
else
  echo "ℹ️ app/admin/page.tsx already exists"
fi

# 2) Update layout nav to include links
cat > app/admin/layout.tsx <<'TSX'
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
TSX
echo "Updated app/admin/layout.tsx nav"

# 3) Patch LoginClient to also store key in localStorage (cookie remains source of truth for middleware)
LOGIN_CLIENT="app/admin/login/LoginClient.tsx"
if [[ -f "$LOGIN_CLIENT" ]]; then
  if ! grep -q 'localStorage.setItem("ADMIN_API_KEY"' "$LOGIN_CLIENT"; then
    python - <<'PY'
from pathlib import Path
p = Path("app/admin/login/LoginClient.tsx")
s = p.read_text()

# inject after successful login where cookie is set OR after success condition
# We'll place a safe snippet before any redirect (router.push / window.location)
import re
snippet = '      try { if (typeof window !== "undefined") localStorage.setItem("ADMIN_API_KEY", key); } catch {}\n'

# find likely redirect line
m = re.search(r"\n(\s*)(router\.push\(|window\.location\.href\s*=)", s)
if m:
  indent = m.group(1)
  s = s[:m.start(0)] + "\n" + indent + snippet + s[m.start(0):]
else:
  # fallback: append near end of submit handler by searching for set cookie
  m2 = re.search(r"(document\.cookie\s*=.*?;)", s)
  if m2:
    s = s[:m2.end(1)] + "\n" + snippet + s[m2.end(1):]
p.write_text(s)
print("Injected localStorage ADMIN_API_KEY save into LoginClient.tsx")
PY
  else
    echo "ℹ️ LoginClient already stores ADMIN_API_KEY"
  fi
else
  echo "ℹ️ No app/admin/login/LoginClient.tsx found; skipping localStorage patch"
fi

if [[ "$STASHED" == "1" ]]; then
  git stash pop || { echo "stash pop conflicts - resolve manually"; exit 1; }
fi

echo "✅ patch_504 done"
git status --porcelain=v1
