import { NextRequest, NextResponse } from "next/server";

const API_ORIGIN =
  process.env.API_ORIGIN ||
  process.env.NEXT_PUBLIC_API_BASE ||
  "https://instadrafts-api-xkrdwictda-el.a.run.app";

async function handler(req: NextRequest, ctx: { params: { path: string[] } }) {
  const path = (ctx.params?.path || []).join("/");
  const url = `${API_ORIGIN}/${path}`;

  const headers = new Headers(req.headers);
  headers.delete("host");

  // Inject admin key from cookie (backend enforces ADMIN_API_KEY)
  const adminKey = req.cookies.get("instadrafts_admin_key")?.value;
  if (adminKey) headers.set("x-admin-key", adminKey);

  // Don't forward browser cookies to API
  headers.delete("cookie");

  const method = req.method.toUpperCase();
  let body: any = undefined;

  if (method !== "GET" && method !== "HEAD") {
    const ab = await req.arrayBuffer();
    body = Buffer.from(ab);
  }

  const r = await fetch(url, { method, headers, body });

  const respHeaders = new Headers(r.headers);
  respHeaders.delete("content-encoding"); // avoid gzip issues in proxy

  const data = await r.arrayBuffer();
  return new NextResponse(data, { status: r.status, headers: respHeaders });
}

export const GET = handler;
export const POST = handler;
export const PATCH = handler;
export const DELETE = handler;
