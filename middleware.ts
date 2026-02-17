import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // allow proxy + static
  if (pathname.startsWith("/api/")) return NextResponse.next();
  if (pathname.startsWith("/_next/")) return NextResponse.next();
  if (pathname === "/favicon.ico") return NextResponse.next();

  // allow login page
  if (pathname.startsWith("/admin/login")) return NextResponse.next();

  // protect all other /admin routes
  if (pathname.startsWith("/admin")) {
    const key = req.cookies.get("admin_key")?.value;
    if (!key) {
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/:path*"],
};
