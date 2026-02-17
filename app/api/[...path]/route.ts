import { NextRequest, NextResponse } from "next/server";

function apiBase() {
  return (
    process.env.NEXT_PUBLIC_API_BASE ||
    process.env.API_BASE ||
    "https://instadrafts-api-xkrdwictda-el.a.run.app"
  );
}

async function handler(req: NextRequest, { params }: { params: { path: string[] } }) {
  const path = (params.path || []).join("/");
  const url = `${apiBase()}/${path}${req.nextUrl.search}`;

  const adminKey = req.cookies.get("admin_key")?.value || "";

  // copy headers, but remove host and set admin key if present
  const headers = new Headers(req.headers);
  headers.delete("host");
  headers.set("accept", "application/json, text/plain, */*");
  if (adminKey) headers.set("x-admin-key", adminKey);

  const init: RequestInit = {
    method: req.method,
    headers,
  };

  // forward body for non-GET/HEAD
  if (req.method !== "GET" && req.method !== "HEAD") {
    const ct = req.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
      init.body = JSON.stringify(await req.json().catch(() => ({})));
      headers.set("content-type", "application/json");
    } else {
      init.body = await req.arrayBuffer();
    }
  }

  const upstream = await fetch(url, init);
  const text = await upstream.text();

  return new NextResponse(text, {
    status: upstream.status,
    headers: {
      "content-type": upstream.headers.get("content-type") || "application/json; charset=utf-8",
      "access-control-allow-origin": "*",
    },
  });
}

export const GET = handler;
export const POST = handler;
export const PATCH = handler;
export const DELETE = handler;
