import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({} as any));
  const key = String((body as any)?.key || "").trim();
  if (!key) return NextResponse.json({ ok: false, error: { message: "MISSING_KEY" } }, { status: 400 });

  const res = NextResponse.json({ ok: true });
  res.cookies.set("instadrafts_admin_key", key, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
  return res;
}
