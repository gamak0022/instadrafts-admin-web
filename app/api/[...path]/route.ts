import { NextRequest, NextResponse } from "next/server";

function apiBase() {
  return (
    process.env.NEXT_PUBLIC_API_BASE ||
    "https://instadrafts-api-xkrdwictda-el.a.run.app"
  ).replace(/\/+$/, "");
}

async function handle(req: NextRequest, ctx: { params: { path?: string[] } }) {
  const parts = ctx.params.path || [];
  const path = "/" + parts.join("/"); // e.g. /v1/admin/tasks
  const url = new URL(req.url);

  // We only proxy /api/* requests; caller usually uses /api/v1/...
  // This route receives [...path] after /api/
  const target = apiBase() + path + (url.search ? url.search : "");

  const headers = new Headers(req.headers);

  // Admin identity (temporary until auth)
  headers.set("x-user-role", "ADMIN");
  headers.set("x-user-id", "admin_demo");

  // Avoid host mismatch, compression issues
  headers.delete("host");

  // If body exists, read it
  const method = req.method.toUpperCase();
  const hasBody = !["GET", "HEAD"].includes(method);

  const upstream = await fetch(target, {
    method,
    headers,
    body: hasBody ? await req.arrayBuffer() : undefined,
    redirect: "manual",
  });

  const resHeaders = new Headers(upstream.headers);
  // Let browser read JSON
  resHeaders.set("access-control-allow-origin", "*");

  const buf = await upstream.arrayBuffer();
  return new NextResponse(buf, {
    status: upstream.status,
    headers: resHeaders,
  });
}

export const GET = handle;
export const POST = handle;
export const PATCH = handle;
export const PUT = handle;
export const DELETE = handle;
